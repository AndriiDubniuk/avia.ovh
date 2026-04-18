import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MonobankClientService } from '../monobank/monobank-client.service';
import { WebhookEventsService } from './webhook-events.service';
import {
  computeNextChargeDates,
  extractExpMonth,
  extractExpYear,
  extractMaskedPan,
  extractToken,
  getEventKey,
  getEventType,
  getInvoiceId,
  getSubscriptionId,
  getProviderPaymentId,
  getStatus,
} from './webhooks.utils';
import { CheckoutSession } from '../checkout/entities/checkout-session.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PaymentAttempt } from '../payments/entities/payment-attempt.entity';
import { CheckoutStatus } from '../checkout/enums/checkout-status.enum';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { PaymentAttemptStatus } from '../payments/enums/payment-attempt-status.enum';
import { PaymentAttemptType } from '../payments/enums/payment-attempt-type.enum';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { Client } from '../clients/entities/client.entity';
import { BillingEmailService } from '../emails/billing-email.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly monobankClientService: MonobankClientService,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly billingEmailService: BillingEmailService,
    private readonly dataSource: DataSource,
  ) {}

  async handleMonobankWebhook(rawBody: Buffer, signature: string) {
    if (!signature) {
      throw new UnauthorizedException('x-sign header is required.');
    }

    const isValidSignature =
      await this.monobankClientService.verifyWebhookSignature(
        rawBody,
        signature,
      );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid monobank webhook signature.');
    }

    const payload = this.parsePayload(rawBody);
    return this.processIncomingPayload(payload);
  }

  async replayFailedEvent(eventId: string) {
    const event =
      await this.webhookEventsService.getFailedEventOrThrow(eventId);

    try {
      const mapped = await this.processEventPayload(event.payloadJson);
      await this.trySendMappedEmails(mapped);
      await this.webhookEventsService.markProcessed(event.id);
      return { ok: true, replayed: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown webhook processing error';
      await this.webhookEventsService.markFailed(event.id, message);
      throw error;
    }
  }

  async triggerMockInitialPaymentWebhook(
    subscriptionId: string,
    mode: 'success' | 'failure' | 'expired',
  ) {
    const checkout = await this.dataSource
      .getRepository(CheckoutSession)
      .findOne({
        where: { subscriptionId },
        order: { createdAt: 'DESC' },
      });

    if (!checkout) {
      throw new BadRequestException(
        'Checkout session not found for subscription.',
      );
    }

    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      type: 'payment',
      invoiceId: checkout.providerInvoiceId,
      subscriptionId: checkout.providerSubscriptionId,
      paymentId: `mock-${mode}-${Date.now()}`,
      modifiedDate: now,
      status: mode,
    };

    if (mode === 'success') {
      payload.walletData = {
        cardToken: `mock-card-token-${Date.now()}`,
        maskedPan: '4444********4444',
        expMonth: 12,
        expYear: 2030,
      };
    }

    const result = await this.processIncomingPayload(payload);

    return {
      ...result,
      mock: true,
      mode,
      subscription_id: subscriptionId,
      provider_invoice_id: checkout.providerInvoiceId,
    };
  }

  private async processIncomingPayload(payload: Record<string, unknown>) {
    const eventKey = getEventKey(payload);
    const eventType = getEventType(payload);

    const created = await this.webhookEventsService.createPendingEvent({
      provider: 'monobank',
      eventKey,
      eventType,
      payloadJson: payload,
      signatureValid: true,
    });

    if (created.duplicate) {
      return { ok: true, duplicate: true };
    }

    const eventId = created.event!.id;

    try {
      const mapped = await this.processEventPayload(payload);
      await this.trySendMappedEmails(mapped);
      await this.webhookEventsService.markProcessed(eventId);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown webhook processing error';
      await this.webhookEventsService.markFailed(eventId, message);
      throw error;
    }
  }

  private async processEventPayload(payload: Record<string, unknown>) {
    return this.dataSource.transaction(async (manager) => {
      const invoiceId = getInvoiceId(payload);
      const providerSubscriptionId = getSubscriptionId(payload);
      if (!invoiceId && !providerSubscriptionId) {
        throw new BadRequestException(
          'Webhook payload missing invoiceId/subscriptionId.',
        );
      }

      const checkoutRepository = manager.getRepository(CheckoutSession);
      const subscriptionRepository = manager.getRepository(Subscription);
      const clientsRepository = manager.getRepository(Client);
      const paymentAttemptsRepository = manager.getRepository(PaymentAttempt);

      const checkout = await checkoutRepository.findOne({
        where: providerSubscriptionId
          ? { providerSubscriptionId }
          : { providerInvoiceId: invoiceId! },
        lock: { mode: 'pessimistic_write' },
      });

      if (!checkout) {
        throw new BadRequestException('Checkout not found for invoiceId.');
      }

      const subscription = await subscriptionRepository.findOne({
        where: { id: checkout.subscriptionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!subscription) {
        throw new BadRequestException('Subscription not found for checkout.');
      }
      const client = await clientsRepository.findOne({
        where: { id: subscription.clientId },
      });

      if (!client) {
        throw new BadRequestException('Client not found for subscription.');
      }

      const initialAttempt = await paymentAttemptsRepository.findOne({
        where: {
          checkoutSessionId: checkout.id,
          type: PaymentAttemptType.Initial,
          status: PaymentAttemptStatus.Pending,
        },
        order: { createdAt: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (subscription.status === SubscriptionStatus.Cancelled) {
        return { status: 'cancelled' };
      }

      const status = getStatus(payload);
      const providerPaymentId = getProviderPaymentId(payload);
      const recurringKey = `native:${subscription.id}:${new Date().toISOString().slice(0, 7)}`;

      if (status === 'unknown') {
        this.logger.log(
          `Ignoring unsupported monobank webhook status. invoiceId=${invoiceId ?? '-'}, checkoutId=${checkout.id}, subscriptionId=${subscription.id}`,
        );
        return { status: 'ignored' };
      }

      if (status === 'success') {
        await checkoutRepository.update(
          { id: checkout.id },
          { status: CheckoutStatus.Paid },
        );
        if (initialAttempt) {
          await paymentAttemptsRepository.update(
            { id: initialAttempt.id },
            {
              status: PaymentAttemptStatus.Success,
              providerPaymentId,
              finalizedAt: new Date(),
              failureCode: null,
              failureMessage: null,
            },
          );
        } else {
          const existingRecurringAttempt = await paymentAttemptsRepository.findOne(
            {
              where: {
                subscriptionId: subscription.id,
                type: PaymentAttemptType.Recurring,
                billingPeriodKey: recurringKey,
                retryNo: 0,
              },
              lock: { mode: 'pessimistic_write' },
            },
          );

          if (existingRecurringAttempt) {
            await paymentAttemptsRepository.update(
              { id: existingRecurringAttempt.id },
              {
                status: PaymentAttemptStatus.Success,
                providerPaymentId:
                  providerPaymentId ?? existingRecurringAttempt.providerPaymentId,
                providerInvoiceId: invoiceId ?? checkout.providerInvoiceId,
                failureCode: null,
                failureMessage: null,
                finalizedAt: new Date(),
              },
            );
          } else {
            await paymentAttemptsRepository.save(
              paymentAttemptsRepository.create({
                subscriptionId: subscription.id,
                paymentMethodId: subscription.paymentMethodId,
                checkoutSessionId: null,
                type: PaymentAttemptType.Recurring,
                status: PaymentAttemptStatus.Success,
                amountMinor: subscription.amountMinor,
                currency: subscription.currency,
                billingPeriodKey: recurringKey,
                idempotencyKey: `native:${checkout.id}:${providerPaymentId ?? Date.now()}`,
                providerPaymentId: providerPaymentId ?? null,
                providerInvoiceId: invoiceId ?? checkout.providerInvoiceId,
                failureCode: null,
                failureMessage: null,
                retryNo: 0,
                scheduledFor: null,
                finalizedAt: new Date(),
              }),
            );
          }
        }

        const token = extractToken(payload);
        if (token) {
          await this.paymentMethodsService.upsertDefaultMonobankToken(
            {
              clientId: subscription.clientId,
              token,
              maskedPan: extractMaskedPan(payload) ?? undefined,
              expMonth: extractExpMonth(payload) ?? undefined,
              expYear: extractExpYear(payload) ?? undefined,
            },
            manager,
          );
        } else {
          this.logger.warn(
            `Monobank success webhook without card token. invoiceId=${invoiceId ?? '-'}, checkoutId=${checkout.id}, subscriptionId=${subscription.id}`,
          );
        }

        const schedule = computeNextChargeDates({
          interval: subscription.interval,
          anchorDay: subscription.anchorDay,
          fromDate: new Date(),
        });

        await subscriptionRepository.update(
          { id: subscription.id },
          {
            providerSubscriptionId:
              providerSubscriptionId ?? subscription.providerSubscriptionId,
            status: SubscriptionStatus.Active,
            nextChargeAt: schedule.nextChargeAt,
            periodEndAt: schedule.periodEndAt,
          },
        );

        return {
          status: 'success',
          email: {
            kind: (initialAttempt
              ? 'initial_success'
              : 'recurring_success') as
              | 'initial_success'
              | 'recurring_success',
            eventKey: `${initialAttempt ? `initial:${initialAttempt.id}` : `recurring:${checkout.id}`}:success`,
            subscription,
            paymentAttempt: {
              ...(initialAttempt ?? ({} as PaymentAttempt)),
              status: PaymentAttemptStatus.Success,
              finalizedAt: new Date(),
              providerPaymentId,
              failureCode: null,
              failureMessage: null,
            } as PaymentAttempt,
            client,
            checkoutId: checkout.id,
          },
        };
      }

      const isExpired = status === 'expired';
      const checkoutStatus = isExpired
        ? CheckoutStatus.Expired
        : CheckoutStatus.Failed;
      const failureCode = isExpired ? 'expired' : status;

      await checkoutRepository.update(
        { id: checkout.id },
        { status: checkoutStatus },
      );

      if (initialAttempt) {
        await paymentAttemptsRepository.update(
          { id: initialAttempt.id },
          {
            status: PaymentAttemptStatus.Failed,
            failureCode,
            failureMessage: null,
            finalizedAt: new Date(),
          },
        );

        await subscriptionRepository.update(
          { id: subscription.id },
          {
            status: SubscriptionStatus.FailedInitialPayment,
          },
        );

        return {
          status: isExpired ? 'expired' : 'failure',
          email: {
            kind: 'initial_failure' as const,
            eventKey: `initial:${initialAttempt.id}:${isExpired ? 'expired' : 'failure'}`,
            subscription: {
              ...subscription,
              status: SubscriptionStatus.FailedInitialPayment,
            } as Subscription,
            paymentAttempt: {
              ...initialAttempt,
              status: PaymentAttemptStatus.Failed,
              finalizedAt: new Date(),
              failureCode,
              failureMessage: null,
            } as PaymentAttempt,
            client,
            checkoutId: checkout.id,
          },
        };
      }

      const existingRecurringAttempt = await paymentAttemptsRepository.findOne({
        where: {
          subscriptionId: subscription.id,
          type: PaymentAttemptType.Recurring,
          billingPeriodKey: recurringKey,
          retryNo: 0,
        },
        lock: { mode: 'pessimistic_write' },
      });

      let recurringAttempt: PaymentAttempt;
      if (existingRecurringAttempt) {
        recurringAttempt = {
          ...existingRecurringAttempt,
          status: PaymentAttemptStatus.Failed,
          providerPaymentId:
            providerPaymentId ?? existingRecurringAttempt.providerPaymentId,
          providerInvoiceId: invoiceId ?? checkout.providerInvoiceId,
          failureCode,
          failureMessage: null,
          finalizedAt: new Date(),
        } as PaymentAttempt;

        await paymentAttemptsRepository.update(
          { id: existingRecurringAttempt.id },
          {
            status: PaymentAttemptStatus.Failed,
            providerPaymentId:
              providerPaymentId ?? existingRecurringAttempt.providerPaymentId,
            providerInvoiceId: invoiceId ?? checkout.providerInvoiceId,
            failureCode,
            failureMessage: null,
            finalizedAt: recurringAttempt.finalizedAt,
          },
        );
      } else {
        recurringAttempt = paymentAttemptsRepository.create({
          subscriptionId: subscription.id,
          paymentMethodId: subscription.paymentMethodId,
          checkoutSessionId: null,
          type: PaymentAttemptType.Recurring,
          status: PaymentAttemptStatus.Failed,
          amountMinor: subscription.amountMinor,
          currency: subscription.currency,
          billingPeriodKey: recurringKey,
          idempotencyKey: `native:${checkout.id}:fail:${Date.now()}`,
          providerPaymentId: providerPaymentId ?? null,
          providerInvoiceId: invoiceId ?? checkout.providerInvoiceId,
          failureCode,
          failureMessage: null,
          retryNo: 0,
          scheduledFor: null,
          finalizedAt: new Date(),
        });
        await paymentAttemptsRepository.save(recurringAttempt);
      }

      await subscriptionRepository.update(
        { id: subscription.id },
        {
          status: SubscriptionStatus.PastDue,
          lastFailureAt: new Date(),
        },
      );

      return {
        status: isExpired ? 'expired' : 'failure',
        email: {
          kind: 'recurring_failure' as const,
          eventKey: `recurring:${recurringAttempt.id}:${isExpired ? 'expired' : 'failure'}`,
          subscription: {
            ...subscription,
            status: SubscriptionStatus.PastDue,
          } as Subscription,
          paymentAttempt: recurringAttempt,
          client,
          checkoutId: checkout.id,
        },
      };
    });
  }

  private async trySendMappedEmails(mapped: {
    email?: {
      kind:
        | 'initial_success'
        | 'initial_failure'
        | 'recurring_success'
        | 'recurring_failure';
      eventKey: string;
      subscription: Subscription;
      paymentAttempt: PaymentAttempt;
      client: Client;
      checkoutId?: string | null;
    };
  }) {
    if (!mapped.email) {
      return;
    }

    try {
      await this.billingEmailService.sendPaymentOutcomeEmails(mapped.email);
    } catch {
      // Billing flow state remains source of truth; email failures are non-fatal.
    }
  }

  private parsePayload(rawBody: Buffer): Record<string, unknown> {
    try {
      return JSON.parse(rawBody.toString('utf-8')) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Webhook payload must be valid JSON.');
    }
  }
}

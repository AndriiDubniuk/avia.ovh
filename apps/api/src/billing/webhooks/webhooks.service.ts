import {
  BadRequestException,
  Injectable,
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

@Injectable()
export class WebhooksService {
  constructor(
    private readonly monobankClientService: MonobankClientService,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly paymentMethodsService: PaymentMethodsService,
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

      if (mapped.tokenMissing) {
        await this.webhookEventsService.markFailed(event.id, 'token missing');
        return { ok: false, reason: 'token_missing' };
      }

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

      if (mapped.tokenMissing) {
        await this.webhookEventsService.markFailed(eventId, 'token missing');
        return { ok: false, reason: 'token_missing' };
      }

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
      if (!invoiceId) {
        throw new BadRequestException('Webhook payload missing invoiceId.');
      }

      const checkoutRepository = manager.getRepository(CheckoutSession);
      const subscriptionRepository = manager.getRepository(Subscription);
      const paymentAttemptsRepository = manager.getRepository(PaymentAttempt);

      const checkout = await checkoutRepository.findOne({
        where: { providerInvoiceId: invoiceId },
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

      const initialAttempt = await paymentAttemptsRepository.findOne({
        where: {
          checkoutSessionId: checkout.id,
          type: PaymentAttemptType.Initial,
        },
        order: { createdAt: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (!initialAttempt) {
        throw new BadRequestException('Initial payment attempt not found.');
      }

      if (subscription.status === SubscriptionStatus.Cancelled) {
        return { tokenMissing: false, status: 'cancelled' };
      }

      const status = getStatus(payload);
      const providerPaymentId = getProviderPaymentId(payload);

      if (status === 'success') {
        await checkoutRepository.update(
          { id: checkout.id },
          { status: CheckoutStatus.Paid },
        );

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

        const token = extractToken(payload);
        if (!token) {
          await subscriptionRepository.update(
            { id: subscription.id },
            {
              status: SubscriptionStatus.FailedInitialPayment,
            },
          );
          return { tokenMissing: true, status: 'success_no_token' };
        }

        const paymentMethod =
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

        const schedule = computeNextChargeDates({
          interval: subscription.interval,
          anchorDay: subscription.anchorDay,
          fromDate: new Date(),
        });

        await subscriptionRepository.update(
          { id: subscription.id },
          {
            paymentMethodId: paymentMethod.id,
            status: SubscriptionStatus.Active,
            nextChargeAt: schedule.nextChargeAt,
            periodEndAt: schedule.periodEndAt,
          },
        );

        return { tokenMissing: false, status: 'success' };
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

      return { tokenMissing: false, status: isExpired ? 'expired' : 'failure' };
    });
  }

  private parsePayload(rawBody: Buffer): Record<string, unknown> {
    try {
      return JSON.parse(rawBody.toString('utf-8')) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Webhook payload must be valid JSON.');
    }
  }
}

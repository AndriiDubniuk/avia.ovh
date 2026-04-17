import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { findPublicBillingPlan, getPublicBillingPlans } from '../billing.catalog';
import { PaymentAttempt } from '../payments/entities/payment-attempt.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';
import { BillingEmailEvent } from './entities/billing-email-event.entity';
import { ResendEmailService } from './resend-email.service';
import { ConfigService } from '@nestjs/config';

type PaymentOutcomeKind =
  | 'initial_success'
  | 'initial_failure'
  | 'recurring_success'
  | 'recurring_failure';

type PaymentOutcomeInput = {
  kind: PaymentOutcomeKind;
  eventKey: string;
  subscription: Subscription;
  paymentAttempt: PaymentAttempt;
  client: Client;
  checkoutId?: string | null;
};

@Injectable()
export class BillingEmailService {
  private readonly logger = new Logger(BillingEmailService.name);

  constructor(
    @InjectRepository(BillingEmailEvent)
    private readonly emailEventsRepository: Repository<BillingEmailEvent>,
    private readonly resendEmailService: ResendEmailService,
    private readonly configService: ConfigService,
  ) {}

  async sendPortalMagicLinkEmail(input: { to: string; magicLink: string }) {
    const subject = 'Your AVIA billing access link';
    const text = `Open this secure link to access your subscriptions: ${input.magicLink}`;
    const html = `<p>Open this secure link to access your subscriptions:</p><p><a href="${input.magicLink}">${input.magicLink}</a></p>`;

    try {
      await this.resendEmailService.send({
        to: input.to,
        subject,
        html,
        text,
      });
    } catch (error) {
      this.logger.error(
        `Failed to deliver portal magic link to ${input.to}: ${
          error instanceof Error ? error.message : 'unknown_error'
        }`,
      );
    }
  }

  async sendPaymentOutcomeEmails(input: PaymentOutcomeInput) {
    const internalRecipient =
      this.configService.get<string>('BILLING_NOTIFICATION_TO_EMAIL') ?? '';

    const recipients: Array<{ to: string; recipientType: 'customer' | 'internal' }> =
      [{ to: input.client.email, recipientType: 'customer' }];

    if (internalRecipient) {
      recipients.push({
        to: internalRecipient,
        recipientType: 'internal',
      });
    }

    for (const recipient of recipients) {
      await this.sendPaymentOutcomeEmailForRecipient(input, recipient.to, recipient.recipientType);
    }
  }

  private async sendPaymentOutcomeEmailForRecipient(
    input: PaymentOutcomeInput,
    to: string,
    recipientType: 'customer' | 'internal',
  ) {
    const dedupeKey = `${input.eventKey}:${recipientType}`;
    const canSend = await this.reserveEmailEvent(dedupeKey, to, input.kind);
    if (!canSend) {
      return;
    }

    const plan = this.resolvePlan(input.subscription.amountMinor, input.subscription.interval);
    const nextChargeDate = input.subscription.nextChargeAt?.toISOString() ?? null;
    const subjectPrefix = recipientType === 'internal' ? '[Billing] ' : '';
    const subject = `${subjectPrefix}${this.getSubject(input.kind)}`;
    const lines = [
      `Customer: ${input.client.name} <${input.client.email}>`,
      `Plan: ${plan.name}`,
      `Amount: ${input.subscription.amountMinor / 100} ${input.subscription.currency}`,
      `Interval: ${input.subscription.interval}`,
      `Subscription status: ${input.subscription.status}`,
      `Next charge: ${nextChargeDate ?? '-'}`,
      `Subscription ID: ${input.subscription.id}`,
      `Payment attempt ID: ${input.paymentAttempt.id}`,
      `Checkout ID: ${input.checkoutId ?? input.paymentAttempt.checkoutSessionId ?? '-'}`,
    ];

    const text = `${this.getTitle(input.kind)}\n\n${lines.join('\n')}`;
    const html = `<p>${this.getTitle(input.kind)}</p><ul>${lines
      .map((line) => `<li>${line}</li>`)
      .join('')}</ul>`;

    try {
      await this.resendEmailService.send({
        to,
        subject,
        html,
        text,
      });

      await this.markEmailEventSent(dedupeKey, to);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'email_send_failed';
      await this.markEmailEventFailed(dedupeKey, to, message);
      this.logger.error(
        `Failed to send billing outcome email (${input.kind}) to ${to}: ${message}`,
      );
    }
  }

  private resolvePlan(amountMinor: number, interval: SubscriptionInterval) {
    const knownPlans = getPublicBillingPlans();
    const found = knownPlans.find(
      (item) => item.amount_minor === amountMinor && item.interval === interval,
    );

    if (found) {
      return found;
    }

    const fallback = findPublicBillingPlan('annual');
    if (fallback) {
      return fallback;
    }

    return { name: 'Subscription' };
  }

  private getSubject(kind: PaymentOutcomeKind) {
    switch (kind) {
      case 'initial_success':
        return 'Initial payment succeeded';
      case 'initial_failure':
        return 'Initial payment failed or expired';
      case 'recurring_success':
        return 'Recurring payment succeeded';
      default:
        return 'Recurring payment failed';
    }
  }

  private getTitle(kind: PaymentOutcomeKind) {
    switch (kind) {
      case 'initial_success':
        return 'Initial payment success';
      case 'initial_failure':
        return 'Initial payment failure/expiry';
      case 'recurring_success':
        return 'Recurring payment success';
      default:
        return 'Recurring payment failure';
    }
  }

  private async reserveEmailEvent(
    eventKey: string,
    recipientEmail: string,
    kind: string,
  ) {
    try {
      await this.emailEventsRepository.save(
        this.emailEventsRepository.create({
          eventKey,
          recipientEmail,
          kind,
          status: 'pending',
          sentAt: null,
          errorMessage: null,
        }),
      );
      return true;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        typeof (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === 'string' &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        return false;
      }

      throw error;
    }
  }

  private async markEmailEventSent(eventKey: string, recipientEmail: string) {
    await this.emailEventsRepository.update(
      { eventKey, recipientEmail },
      {
        status: 'sent',
        sentAt: new Date(),
        errorMessage: null,
      },
    );
  }

  private async markEmailEventFailed(
    eventKey: string,
    recipientEmail: string,
    errorMessage: string,
  ) {
    await this.emailEventsRepository.update(
      { eventKey, recipientEmail },
      {
        status: 'failed',
        errorMessage,
      },
    );
  }
}

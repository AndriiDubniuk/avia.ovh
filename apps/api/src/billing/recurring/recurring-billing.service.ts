import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { BillingEmailService } from '../emails/billing-email.service';
import { MonobankClientService } from '../monobank/monobank-client.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentAttemptStatus } from '../payments/enums/payment-attempt-status.enum';
import { PaymentAttemptType } from '../payments/enums/payment-attempt-type.enum';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import {
  buildRecurringBillingPeriodKey,
  buildRecurringIdempotencyKey,
  computeNextChargeDatesForTimezone,
  computeRetryScheduleDate,
} from './recurring-billing.utils';
import { PaymentAttempt } from '../payments/entities/payment-attempt.entity';

type DueChargeOutcome =
  | 'charged'
  | 'failed_scheduled_retry'
  | 'suspended'
  | 'duplicate_skipped'
  | 'missing_payment_method'
  | 'cancelled_skipped';

type DueChargeProcessResult = {
  subscriptionId: string;
  outcome: DueChargeOutcome;
  paymentAttemptId?: string;
  billingPeriodKey?: string;
};

@Injectable()
export class RecurringBillingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentsService: PaymentsService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly monobankClientService: MonobankClientService,
    private readonly billingEmailService: BillingEmailService,
  ) {}

  async runDueCharges(limit = 50) {
    let processed = 0;
    const results: DueChargeProcessResult[] = [];

    while (processed < limit) {
      const result = await this.processOneDueSubscription();
      if (!result) {
        break;
      }

      results.push(result);
      await this.trySendRecurringOutcomeEmail(result);
      processed += 1;
    }

    return {
      ok: true,
      processed,
      charged: results.filter((item) => item.outcome === 'charged').length,
      failed_scheduled_retry: results.filter(
        (item) => item.outcome === 'failed_scheduled_retry',
      ).length,
      suspended: results.filter((item) => item.outcome === 'suspended').length,
      duplicate_skipped: results.filter(
        (item) => item.outcome === 'duplicate_skipped',
      ).length,
      missing_payment_method: results.filter(
        (item) => item.outcome === 'missing_payment_method',
      ).length,
      cancelled_skipped: results.filter(
        (item) => item.outcome === 'cancelled_skipped',
      ).length,
      items: results,
    };
  }

  private async trySendRecurringOutcomeEmail(result: DueChargeProcessResult) {
    const shouldSendSuccess = result.outcome === 'charged';
    const shouldSendFailure =
      result.outcome === 'failed_scheduled_retry' ||
      result.outcome === 'suspended';

    if (!result.paymentAttemptId || (!shouldSendSuccess && !shouldSendFailure)) {
      return;
    }

    try {
      const [paymentAttempt, subscription] = await Promise.all([
        this.dataSource.getRepository(PaymentAttempt).findOne({
          where: { id: result.paymentAttemptId },
        }),
        this.dataSource.getRepository(Subscription).findOne({
          where: { id: result.subscriptionId },
        }),
      ]);

      if (!paymentAttempt || !subscription) {
        return;
      }

      const client = await this.dataSource.getRepository(Client).findOne({
        where: { id: subscription.clientId },
      });

      if (!client) {
        return;
      }

      await this.billingEmailService.sendPaymentOutcomeEmails({
        kind: shouldSendSuccess ? 'recurring_success' : 'recurring_failure',
        eventKey: `recurring:${paymentAttempt.id}:${shouldSendSuccess ? 'success' : 'failure'}`,
        subscription,
        paymentAttempt,
        client,
      });
    } catch {
      // Email delivery issues must not break recurring billing execution.
    }
  }

  private async processOneDueSubscription(): Promise<DueChargeProcessResult | null> {
    return this.dataSource.transaction(async (manager) => {
      const subscription =
        await this.selectNextDueSubscriptionForUpdate(manager);
      if (!subscription) {
        return null;
      }

      return this.processLockedSubscription(manager, subscription);
    });
  }

  private async processLockedSubscription(
    manager: EntityManager,
    subscription: Subscription,
  ): Promise<DueChargeProcessResult> {
    const now = new Date();
    const subscriptionRepository = manager.getRepository(Subscription);

    if (
      subscription.status === SubscriptionStatus.Cancelled ||
      subscription.cancelledAt
    ) {
      return {
        subscriptionId: subscription.id,
        outcome: 'cancelled_skipped',
      };
    }

    if (!subscription.paymentMethodId) {
      await subscriptionRepository.update(
        { id: subscription.id },
        {
          status: SubscriptionStatus.Suspended,
          nextChargeAt: null,
          lastFailureAt: now,
        },
      );

      return {
        subscriptionId: subscription.id,
        outcome: 'missing_payment_method',
      };
    }

    const paymentMethod = await this.paymentMethodsService.findActiveById(
      subscription.paymentMethodId,
      manager,
    );

    if (!paymentMethod) {
      await subscriptionRepository.update(
        { id: subscription.id },
        {
          status: SubscriptionStatus.Suspended,
          nextChargeAt: null,
          lastFailureAt: now,
        },
      );

      return {
        subscriptionId: subscription.id,
        outcome: 'missing_payment_method',
      };
    }

    const periodReferenceDate =
      subscription.periodEndAt ?? subscription.nextChargeAt ?? now;
    const billingPeriodKey = buildRecurringBillingPeriodKey({
      subscriptionId: subscription.id,
      interval: subscription.interval,
      periodReferenceDate,
      clientTimezone: subscription.clientTimezone,
    });
    const idempotencyKey = buildRecurringIdempotencyKey({
      subscriptionId: subscription.id,
      billingPeriodKey,
      retryNo: subscription.retryCount,
    });

    const existingAttempt = await manager
      .getRepository(PaymentAttempt)
      .findOne({
        where: {
          subscriptionId: subscription.id,
          type: PaymentAttemptType.Recurring,
          billingPeriodKey,
          retryNo: subscription.retryCount,
          status: In([
            PaymentAttemptStatus.Pending,
            PaymentAttemptStatus.Success,
          ]),
        },
        lock: { mode: 'pessimistic_write' },
      });

    if (existingAttempt) {
      return {
        subscriptionId: subscription.id,
        outcome: 'duplicate_skipped',
        paymentAttemptId: existingAttempt.id,
        billingPeriodKey,
      };
    }

    const createdAttempt =
      await this.paymentsService.createRecurringPendingAttempt(
        {
          subscriptionId: subscription.id,
          paymentMethodId: paymentMethod.id,
          amountMinor: subscription.amountMinor,
          currency: subscription.currency,
          billingPeriodKey,
          idempotencyKey,
          retryNo: subscription.retryCount,
          scheduledFor: subscription.nextChargeAt ?? now,
        },
        manager,
      );

    if (!createdAttempt) {
      return {
        subscriptionId: subscription.id,
        outcome: 'duplicate_skipped',
        billingPeriodKey,
      };
    }

    const cardToken = this.paymentMethodsService.decryptToken(
      paymentMethod.cardTokenEncrypted,
    );

    try {
      const providerCharge =
        await this.monobankClientService.createRecurringCharge({
          amountMinor: subscription.amountMinor,
          currency: subscription.currency,
          reference: `${subscription.id}:${billingPeriodKey}`,
          cardToken,
          idempotencyKey,
        });

      if (providerCharge.status === 'success') {
        await this.paymentsService.finalizeAttemptSuccess(
          createdAttempt.id,
          providerCharge.providerPaymentId,
        );

        const next = computeNextChargeDatesForTimezone({
          interval: subscription.interval,
          anchorDay: subscription.anchorDay,
          fromDate: periodReferenceDate,
          clientTimezone: subscription.clientTimezone,
        });

        await subscriptionRepository.update(
          { id: subscription.id },
          {
            status: SubscriptionStatus.Active,
            nextChargeAt: next.nextChargeAt,
            periodEndAt: next.periodEndAt,
            retryCount: 0,
            lastFailureAt: null,
          },
        );

        return {
          subscriptionId: subscription.id,
          outcome: 'charged',
          paymentAttemptId: createdAttempt.id,
          billingPeriodKey,
        };
      }

      return this.handleRecurringFailure(
        subscription,
        createdAttempt.id,
        providerCharge.failureCode ?? 'provider_failure',
        providerCharge.failureMessage ?? 'Recurring charge failed.',
        now,
        subscriptionRepository,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Recurring provider call failed.';

      return this.handleRecurringFailure(
        subscription,
        createdAttempt.id,
        'provider_exception',
        message,
        now,
        subscriptionRepository,
      );
    }
  }

  private async handleRecurringFailure(
    subscription: Subscription,
    attemptId: string,
    failureCode: string,
    failureMessage: string,
    failedAt: Date,
    subscriptionRepository: Repository<Subscription>,
  ): Promise<DueChargeProcessResult> {
    await this.paymentsService.finalizeAttemptFailure(
      attemptId,
      failureCode,
      failureMessage,
    );

    const nextRetryCount = subscription.retryCount + 1;
    const retryAt = computeRetryScheduleDate({
      failedAt,
      retryCount: nextRetryCount,
      clientTimezone: subscription.clientTimezone,
    });

    if (!retryAt || nextRetryCount > subscription.maxRetries) {
      await subscriptionRepository.update(
        { id: subscription.id },
        {
          status: SubscriptionStatus.Suspended,
          retryCount: nextRetryCount,
          nextChargeAt: null,
          lastFailureAt: failedAt,
        },
      );

      return {
        subscriptionId: subscription.id,
        outcome: 'suspended',
        paymentAttemptId: attemptId,
      };
    }

    await subscriptionRepository.update(
      { id: subscription.id },
      {
        status: SubscriptionStatus.PastDue,
        retryCount: nextRetryCount,
        nextChargeAt: retryAt,
        lastFailureAt: failedAt,
      },
    );

    return {
      subscriptionId: subscription.id,
      outcome: 'failed_scheduled_retry',
      paymentAttemptId: attemptId,
    };
  }

  private async selectNextDueSubscriptionForUpdate(
    manager: EntityManager,
  ): Promise<Subscription | null> {
    const now = new Date();

    return manager
      .getRepository(Subscription)
      .createQueryBuilder('subscription')
      .where('subscription.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.Active, SubscriptionStatus.PastDue],
      })
      .andWhere('subscription.cancelled_at IS NULL')
      .andWhere('subscription.payment_method_id IS NOT NULL')
      .andWhere('subscription.next_charge_at IS NOT NULL')
      .andWhere('subscription.next_charge_at <= :now', { now })
      .orderBy('subscription.next_charge_at', 'ASC')
      .addOrderBy('subscription.created_at', 'ASC')
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .getOne();
  }
}

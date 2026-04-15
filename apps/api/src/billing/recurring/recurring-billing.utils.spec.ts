import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';
import {
  buildRecurringBillingPeriodKey,
  buildRecurringIdempotencyKey,
  computeNextChargeDatesForTimezone,
  computeRetryScheduleDate,
} from './recurring-billing.utils';

describe('RecurringBillingUtils', () => {
  it('builds deterministic billing period and idempotency keys', () => {
    const periodKey = buildRecurringBillingPeriodKey({
      subscriptionId: 'sub-1',
      interval: SubscriptionInterval.Monthly,
      periodReferenceDate: new Date('2026-04-01T00:00:00.000Z'),
      clientTimezone: 'Europe/Kyiv',
    });

    expect(periodKey).toBe('recurring:sub-1:2026-04');
    expect(
      buildRecurringIdempotencyKey({
        subscriptionId: 'sub-1',
        billingPeriodKey: periodKey,
        retryNo: 2,
      }),
    ).toBe('rec:sub-1:recurring:sub-1:2026-04:r2');
  });

  it('handles monthly rollover for short months with anchor day', () => {
    const result = computeNextChargeDatesForTimezone({
      interval: SubscriptionInterval.Monthly,
      anchorDay: 31,
      fromDate: new Date('2026-01-31T09:00:00.000Z'),
      clientTimezone: 'UTC',
    });

    expect(result.nextChargeAt.toISOString()).toBe('2026-02-28T09:00:00.000Z');
    expect(result.periodEndAt.toISOString()).toBe('2026-02-28T09:00:00.000Z');
  });

  it('handles yearly rollover for leap years with anchor day', () => {
    const result = computeNextChargeDatesForTimezone({
      interval: SubscriptionInterval.Yearly,
      anchorDay: 29,
      fromDate: new Date('2024-02-29T09:00:00.000Z'),
      clientTimezone: 'UTC',
    });

    expect(result.nextChargeAt.toISOString()).toBe('2025-02-28T09:00:00.000Z');
  });

  it('computes retry schedule progression (+1, +3, +5 days)', () => {
    const failedAt = new Date('2026-04-10T09:00:00.000Z');

    expect(
      computeRetryScheduleDate({
        failedAt,
        retryCount: 1,
        clientTimezone: 'UTC',
      })?.toISOString(),
    ).toBe('2026-04-11T09:00:00.000Z');

    expect(
      computeRetryScheduleDate({
        failedAt,
        retryCount: 2,
        clientTimezone: 'UTC',
      })?.toISOString(),
    ).toBe('2026-04-13T09:00:00.000Z');

    expect(
      computeRetryScheduleDate({
        failedAt,
        retryCount: 3,
        clientTimezone: 'UTC',
      })?.toISOString(),
    ).toBe('2026-04-15T09:00:00.000Z');

    expect(
      computeRetryScheduleDate({
        failedAt,
        retryCount: 4,
        clientTimezone: 'UTC',
      }),
    ).toBeNull();
  });
});

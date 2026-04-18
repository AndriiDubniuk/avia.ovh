import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';
import {
  computeNextChargeDates,
  extractToken,
  getEventKey,
  getStatus,
} from './webhooks.utils';

describe('webhooks.utils', () => {
  it('builds deterministic event key', () => {
    const payload = {
      invoiceId: 'inv-1',
      status: 'success',
      modifiedDate: '2026-04-15T10:00:00.000Z',
    };

    expect(getEventKey(payload)).toBe('inv-1:success:2026-04-15T10:00:00.000Z');
  });

  it('maps statuses', () => {
    expect(getStatus({ status: 'success' })).toBe('success');
    expect(getStatus({ status: 'paid' })).toBe('success');
    expect(getStatus({ status: 'failure' })).toBe('failure');
    expect(getStatus({ status: 'expired' })).toBe('expired');
  });

  it('extracts token from walletData', () => {
    expect(
      extractToken({
        walletData: {
          cardToken: 'tok_123',
        },
      }),
    ).toBe('tok_123');
  });

  it('computes monthly dates preserving anchor day', () => {
    const result = computeNextChargeDates({
      interval: SubscriptionInterval.Monthly,
      anchorDay: 31,
      fromDate: new Date('2026-01-15T00:00:00.000Z'),
    });

    expect(result.nextChargeAt.toISOString()).toBe('2026-02-28T09:00:00.000Z');
    expect(result.periodEndAt.toISOString()).toBe('2026-02-28T09:00:00.000Z');
  });

  it('computes yearly dates preserving anchor day', () => {
    const result = computeNextChargeDates({
      interval: SubscriptionInterval.Yearly,
      anchorDay: 29,
      fromDate: new Date('2024-02-10T00:00:00.000Z'),
    });

    expect(result.nextChargeAt.toISOString()).toBe('2025-02-28T09:00:00.000Z');
  });
});

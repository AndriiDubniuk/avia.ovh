import {
  findSubscriptionId,
  mapBillingCheckoutStatus,
  sanitizeMonobankPayload,
} from './billing.utils';

describe('billing utils', () => {
  it('maps monobank statuses to checkout states', () => {
    expect(mapBillingCheckoutStatus('active')).toBe('active');
    expect(mapBillingCheckoutStatus('created')).toBe('awaiting_payment');
    expect(mapBillingCheckoutStatus('cancelled')).toBe('cancelled');
    expect(mapBillingCheckoutStatus('expired')).toBe('expired');
    expect(mapBillingCheckoutStatus('failed')).toBe('failed');
    expect(mapBillingCheckoutStatus('something-new')).toBe('pending');
    expect(mapBillingCheckoutStatus(undefined)).toBe('created');
  });

  it('removes card tokens from webhook payloads', () => {
    expect(
      sanitizeMonobankPayload({
        walletData: {
          cardToken: 'secret',
          walletId: 'wallet-1',
        },
        nested: [{ cardToken: 'secret-2', status: 'created' }],
      }),
    ).toEqual({
      walletData: {
        walletId: 'wallet-1',
      },
      nested: [{ status: 'created' }],
    });
  });

  it('finds subscription ids recursively', () => {
    expect(findSubscriptionId({ subscriptionId: 'sub-1' })).toBe('sub-1');
    expect(findSubscriptionId({ data: { subscriptionId: 'sub-2' } })).toBe(
      'sub-2',
    );
    expect(findSubscriptionId({ data: { value: 'none' } })).toBeNull();
  });
});

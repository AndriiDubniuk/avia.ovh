import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MonobankAcquiringService } from '../monobank-acquiring.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CheckoutService } from './checkout.service';
import { CheckoutSession } from './entities/checkout-session.entity';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let repository: jest.Mocked<Repository<CheckoutSession>>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let monobankAcquiring: jest.Mocked<MonobankAcquiringService>;
  let paymentsService: jest.Mocked<PaymentsService>;
  let configService: jest.Mocked<ConfigService>;

  const subscription = {
    id: 'sub-1',
    clientId: 'client-1',
    status: SubscriptionStatus.PendingInitialPayment,
    amountMinor: 1000,
    currency: 'UAH',
    interval: SubscriptionInterval.Monthly,
  } as never;

  beforeEach(() => {
    repository = {
      create: jest.fn((input) => input),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CheckoutSession>>;

    subscriptionsService = {
      findByIdOrFail: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionsService>;

    monobankAcquiring = {
      createSubscription: jest.fn(),
    } as unknown as jest.Mocked<MonobankAcquiringService>;

    paymentsService = {
      createInitialPendingAttempt: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'MONOBANK_MODE') return 'mock';
        if (key === 'MONOBANK_WEBHOOK_URL')
          return 'https://api.example.com/v1/billing/webhooks/monobank';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new CheckoutService(
      repository,
      subscriptionsService,
      monobankAcquiring,
      paymentsService,
      configService,
    );
  });

  it('throws when subscription status is not pending initial payment', async () => {
    subscriptionsService.findByIdOrFail.mockResolvedValue({
      id: 'sub-1',
      status: SubscriptionStatus.Active,
    } as never);

    await expect(
      service.createCheckoutSession('sub-1', {
        return_url: 'https://example.com/return',
        tokenization_requested: true,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('creates checkout in mock mode without monobank HTTP call', async () => {
    subscriptionsService.findByIdOrFail.mockResolvedValue(subscription);
    repository.save.mockImplementation(async (input) => input as never);

    const result = await service.createCheckoutSession('sub-1', {
      return_url: 'https://example.com/result',
      tokenization_requested: true,
    });

    expect(monobankAcquiring.createSubscription).not.toHaveBeenCalled();
    expect(result.checkout_url).toContain('checkoutId=');
    expect(result.provider_invoice_id).toContain('mock-invoice-');
    expect(paymentsService.createInitialPendingAttempt).toHaveBeenCalledTimes(1);
  });

  it('creates checkout in real mode via monobank native subscription API', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'MONOBANK_MODE') return 'real';
      if (key === 'MONOBANK_WEBHOOK_URL')
        return 'https://api.example.com/v1/billing/webhooks/monobank';
      return undefined;
    });

    subscriptionsService.findByIdOrFail.mockResolvedValue(subscription);
    monobankAcquiring.createSubscription.mockResolvedValue({
      subscriptionId: 'mono-sub-1',
      pageUrl: 'https://pay.example',
    } as never);
    repository.save.mockImplementation(async (input) => input as never);

    const result = await service.createCheckoutSession('sub-1', {
      return_url: 'https://example.com/return',
      tokenization_requested: true,
    });

    expect(monobankAcquiring.createSubscription).toHaveBeenCalledTimes(1);
    expect(result.provider_invoice_id).toBe('mono-subscription:mono-sub-1');
  });
});

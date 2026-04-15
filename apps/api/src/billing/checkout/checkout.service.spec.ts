import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MonobankClientService } from '../monobank/monobank-client.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CheckoutService } from './checkout.service';
import { CheckoutSession } from './entities/checkout-session.entity';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let repository: jest.Mocked<Repository<CheckoutSession>>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let monobankClient: jest.Mocked<MonobankClientService>;
  let paymentsService: jest.Mocked<PaymentsService>;
  let configService: jest.Mocked<ConfigService>;

  const subscription = {
    id: 'sub-1',
    clientId: 'client-1',
    status: SubscriptionStatus.PendingInitialPayment,
    amountMinor: 1000,
    currency: 'UAH',
  } as never;

  beforeEach(() => {
    repository = {
      create: jest.fn((input) => input),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CheckoutSession>>;

    subscriptionsService = {
      findByIdOrFail: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionsService>;

    monobankClient = {
      createInvoice: jest.fn(),
    } as unknown as jest.Mocked<MonobankClientService>;

    paymentsService = {
      createInitialPendingAttempt: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'MONOBANK_MODE') return 'mock';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new CheckoutService(
      repository,
      subscriptionsService,
      monobankClient,
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

    expect(monobankClient.createInvoice).not.toHaveBeenCalled();
    expect(result.checkout_url).toContain('checkoutId=');
    expect(result.provider_invoice_id).toContain('mock-invoice-');
    expect(paymentsService.createInitialPendingAttempt).toHaveBeenCalledTimes(1);
  });

  it('creates checkout in real mode via monobank client', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'MONOBANK_MODE') return 'real';
      return undefined;
    });

    subscriptionsService.findByIdOrFail.mockResolvedValue(subscription);
    monobankClient.createInvoice.mockResolvedValue({
      providerInvoiceId: 'inv-1',
      checkoutUrl: 'https://pay.example',
      expiresAt: new Date('2026-04-15T00:00:00.000Z'),
      providerPayloadJson: {},
    });
    repository.save.mockImplementation(async (input) => input as never);

    const result = await service.createCheckoutSession('sub-1', {
      return_url: 'https://example.com/return',
      tokenization_requested: true,
    });

    expect(monobankClient.createInvoice).toHaveBeenCalledTimes(1);
    expect(result.provider_invoice_id).toBe('inv-1');
  });
});

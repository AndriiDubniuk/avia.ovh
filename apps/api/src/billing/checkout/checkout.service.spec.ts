import { Repository } from 'typeorm';
import { UnprocessableEntityException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutSession } from './entities/checkout-session.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MonobankClientService } from '../monobank/monobank-client.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let repository: jest.Mocked<Repository<CheckoutSession>>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let monobankClient: jest.Mocked<MonobankClientService>;
  let paymentsService: jest.Mocked<PaymentsService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
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

    service = new CheckoutService(
      repository,
      subscriptionsService,
      monobankClient,
      paymentsService,
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

  it('creates checkout session and pending initial attempt', async () => {
    const subscription = {
      id: 'sub-1',
      clientId: 'client-1',
      status: SubscriptionStatus.PendingInitialPayment,
      amountMinor: 1000,
      currency: 'UAH',
    } as never;

    const session = {
      id: 'chk-1',
      providerInvoiceId: 'inv-1',
      checkoutUrl: 'https://pay.example',
      status: 'created',
      expiresAt: new Date('2026-04-15T00:00:00.000Z'),
    } as unknown as CheckoutSession;

    subscriptionsService.findByIdOrFail.mockResolvedValue(subscription);
    monobankClient.createInvoice.mockResolvedValue({
      providerInvoiceId: 'inv-1',
      checkoutUrl: 'https://pay.example',
      expiresAt: new Date('2026-04-15T00:00:00.000Z'),
      providerPayloadJson: {},
    });
    repository.create.mockReturnValue(session);
    repository.save.mockResolvedValue(session);

    const result = await service.createCheckoutSession('sub-1', {
      return_url: 'https://example.com/return',
      tokenization_requested: true,
    });

    expect(paymentsService.createInitialPendingAttempt).toHaveBeenCalled();
    expect(result.provider_invoice_id).toBe('inv-1');
  });
});

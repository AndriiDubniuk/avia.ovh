import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { CheckoutService } from './checkout/checkout.service';
import { CheckoutSession } from './checkout/entities/checkout-session.entity';
import { CheckoutStatus } from './checkout/enums/checkout-status.enum';
import { PaymentsService } from './payments/payments.service';
import { PaymentAttemptStatus } from './payments/enums/payment-attempt-status.enum';
import { PaymentAttemptType } from './payments/enums/payment-attempt-type.enum';
import { SubscriptionInterval } from './subscriptions/enums/subscription-interval.enum';
import { SubscriptionStatus } from './subscriptions/enums/subscription-status.enum';
import { SubscriptionsService } from './subscriptions/subscriptions.service';

describe('BillingService (public facade)', () => {
  let service: BillingService;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let checkoutService: jest.Mocked<CheckoutService>;
  let paymentsService: jest.Mocked<PaymentsService>;
  let checkoutRepository: { findOne: jest.Mock };

  beforeEach(async () => {
    subscriptionsService = {
      createSubscription: jest.fn(),
      findByIdOrFail: jest.fn(),
      cancelSubscription: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionsService>;

    checkoutService = {
      createCheckoutSession: jest.fn(),
    } as unknown as jest.Mocked<CheckoutService>;

    paymentsService = {
      listBySubscriptionId: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    checkoutRepository = {
      findOne: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: SubscriptionsService, useValue: subscriptionsService },
        { provide: CheckoutService, useValue: checkoutService },
        { provide: PaymentsService, useValue: paymentsService },
        {
          provide: getRepositoryToken(CheckoutSession),
          useValue: checkoutRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(BillingService);
  });

  it('creates checkout via subscription + checkout-session orchestration', async () => {
    subscriptionsService.createSubscription.mockResolvedValue({
      subscription_id: 'sub-1',
    } as never);

    checkoutService.createCheckoutSession.mockResolvedValue({
      checkout_session_id: 'chk-1',
      checkout_url: 'https://pay.example/chk-1',
    } as never);

    const result = await service.createCheckout({
      planCode: 'annual',
      customerName: 'User',
      customerEmail: 'user@example.com',
    });

    expect(subscriptionsService.createSubscription).toHaveBeenCalled();
    expect(checkoutService.createCheckoutSession).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ tokenization_requested: true }),
    );
    expect(result).toEqual({
      checkoutId: 'chk-1',
      subscriptionId: 'sub-1',
      paymentUrl: 'https://pay.example/chk-1',
    });
  });

  it('maps checkout status from current engine state', async () => {
    checkoutRepository.findOne.mockResolvedValue({
      id: 'chk-1',
      subscriptionId: 'sub-1',
      status: CheckoutStatus.Failed,
    });

    subscriptionsService.findByIdOrFail.mockResolvedValue({
      id: 'sub-1',
      amountMinor: 29900,
      currency: 'UAH',
      interval: SubscriptionInterval.Yearly,
      status: SubscriptionStatus.PendingInitialPayment,
      nextChargeAt: null,
      cancelledAt: null,
    } as never);

    paymentsService.listBySubscriptionId.mockResolvedValue([
      {
        status: PaymentAttemptStatus.Failed,
        type: PaymentAttemptType.Initial,
      },
    ] as never);

    const result = await service.getCheckout('chk-1');

    expect(result.status).toBe(SubscriptionStatus.FailedInitialPayment);
    expect(result.totalFailed).toBe(1);
    expect(result.canCancel).toBe(true);
  });

  it('cancels checkout by subscription and re-reads public state', async () => {
    checkoutRepository.findOne
      .mockResolvedValueOnce({ id: 'chk-1', subscriptionId: 'sub-1' })
      .mockResolvedValueOnce({
        id: 'chk-1',
        subscriptionId: 'sub-1',
        status: CheckoutStatus.Paid,
      });

    subscriptionsService.findByIdOrFail.mockResolvedValue({
      id: 'sub-1',
      amountMinor: 29900,
      currency: 'UAH',
      interval: SubscriptionInterval.Yearly,
      status: SubscriptionStatus.Cancelled,
      nextChargeAt: null,
      cancelledAt: new Date('2026-04-15T10:00:00.000Z'),
    } as never);

    paymentsService.listBySubscriptionId.mockResolvedValue([] as never);

    await service.cancelCheckout('chk-1');

    expect(subscriptionsService.cancelSubscription).toHaveBeenCalledWith(
      'sub-1',
    );
  });

  it('throws for unknown checkout id', async () => {
    checkoutRepository.findOne.mockResolvedValue(null);

    await expect(service.getCheckout('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

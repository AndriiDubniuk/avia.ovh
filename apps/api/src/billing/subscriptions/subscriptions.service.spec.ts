/* eslint-disable @typescript-eslint/unbound-method */
import { Repository } from 'typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { PaymentAttempt } from '../payments/entities/payment-attempt.entity';
import { ClientsService } from '../clients/clients.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { MonobankAcquiringService } from '../monobank-acquiring.service';

function makeSubscription(status: SubscriptionStatus): Subscription {
  return {
    id: 'sub-1',
    clientId: 'client-1',
    paymentMethodId: 'pm-1',
    providerSubscriptionId: 'mono-sub-1',
    status,
    amountMinor: 29900,
    currency: 'UAH',
    interval: 'monthly' as never,
    anchorDay: 10,
    clientTimezone: 'UTC',
    nextChargeAt: new Date('2026-04-15T09:00:00.000Z'),
    periodEndAt: new Date('2026-04-15T09:00:00.000Z'),
    cancelRequestedAt: null,
    cancelledAt: null,
    retryCount: 0,
    maxRetries: 3,
    lastFailureAt: null,
    createdAt: new Date('2026-04-01T09:00:00.000Z'),
    updatedAt: new Date('2026-04-01T09:00:00.000Z'),
  } as Subscription;
}

describe('SubscriptionsService cancellation', () => {
  let service: SubscriptionsService;
  let subscriptionsRepository: jest.Mocked<Repository<Subscription>>;
  let paymentAttemptsRepository: jest.Mocked<Repository<PaymentAttempt>>;
  let monobankAcquiringService: jest.Mocked<MonobankAcquiringService>;

  beforeEach(() => {
    const queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    subscriptionsRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Subscription>>;

    paymentAttemptsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as jest.Mocked<Repository<PaymentAttempt>>;

    monobankAcquiringService = {
      cancelSubscription: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<MonobankAcquiringService>;

    service = new SubscriptionsService(
      subscriptionsRepository,
      paymentAttemptsRepository,
      {} as ClientsService,
      monobankAcquiringService,
    );
  });

  it.each([
    SubscriptionStatus.PendingInitialPayment,
    SubscriptionStatus.Active,
    SubscriptionStatus.PastDue,
    SubscriptionStatus.FailedInitialPayment,
    SubscriptionStatus.Suspended,
  ])(
    'cancels subscription from allowed state "%s" and neutralizes future charging',
    async (status) => {
      subscriptionsRepository.findOne
        .mockResolvedValueOnce(makeSubscription(status))
        .mockResolvedValueOnce({
          ...makeSubscription(SubscriptionStatus.Cancelled),
          status: SubscriptionStatus.Cancelled,
          cancelledAt: new Date('2026-04-10T09:00:00.000Z'),
          nextChargeAt: null,
        } as never);

      const result = await service.cancelSubscription('sub-1');

      expect(monobankAcquiringService.cancelSubscription).toHaveBeenCalledWith(
        'mono-sub-1',
      );
      expect(subscriptionsRepository.update).toHaveBeenCalledWith(
        { id: 'sub-1' },
        expect.objectContaining({
          status: SubscriptionStatus.Cancelled,
          nextChargeAt: null,
        }),
      );
      expect(paymentAttemptsRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.status).toBe(SubscriptionStatus.Cancelled);
    },
  );

  it('rejects forbidden cancellation transition', async () => {
    subscriptionsRepository.findOne.mockResolvedValueOnce({
      ...makeSubscription(SubscriptionStatus.Active),
      status: 'unknown' as SubscriptionStatus,
    } as never);

    await expect(service.cancelSubscription('sub-1')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('is idempotent-safe for repeated cancel', async () => {
    subscriptionsRepository.findOne.mockResolvedValueOnce({
      ...makeSubscription(SubscriptionStatus.Cancelled),
      status: SubscriptionStatus.Cancelled,
      cancelledAt: new Date('2026-04-10T09:00:00.000Z'),
      nextChargeAt: null,
    } as never);

    const result = await service.cancelSubscription('sub-1');

    expect(subscriptionsRepository.update).not.toHaveBeenCalled();
    expect(result.status).toBe(SubscriptionStatus.Cancelled);
  });
});

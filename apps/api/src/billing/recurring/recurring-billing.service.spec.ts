/* eslint-disable @typescript-eslint/unbound-method */
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RecurringBillingService } from './recurring-billing.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { MonobankClientService } from '../monobank/monobank-client.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';
import { PaymentAttempt } from '../payments/entities/payment-attempt.entity';

function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    clientId: 'client-1',
    paymentMethodId: 'pm-1',
    status: SubscriptionStatus.Active,
    amountMinor: 29900,
    currency: 'UAH',
    interval: SubscriptionInterval.Monthly,
    anchorDay: 31,
    clientTimezone: 'UTC',
    nextChargeAt: new Date('2026-04-10T09:00:00.000Z'),
    periodEndAt: new Date('2026-04-10T09:00:00.000Z'),
    cancelRequestedAt: null,
    cancelledAt: null,
    retryCount: 0,
    maxRetries: 3,
    lastFailureAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as Subscription;
}

describe('RecurringBillingService', () => {
  let service: RecurringBillingService;
  let dataSource: jest.Mocked<DataSource>;
  let paymentsService: jest.Mocked<PaymentsService>;
  let paymentMethodsService: jest.Mocked<PaymentMethodsService>;
  let monobankClientService: jest.Mocked<MonobankClientService>;

  let subscriptionRepository: jest.Mocked<Repository<Subscription>>;
  let paymentAttemptRepository: jest.Mocked<Repository<PaymentAttempt>>;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    setLock: jest.Mock;
    setOnLocked: jest.Mock;
    getOne: jest.Mock;
  };

  function setupTransactionWithDueSequence(
    sequence: Array<Subscription | null>,
  ) {
    queryBuilder.getOne.mockImplementation(() => sequence.shift() ?? null);
    dataSource.transaction.mockImplementation((cb) => {
      const manager = {
        getRepository: jest.fn((entity: { name?: string }) => {
          if (entity.name === 'Subscription') {
            return subscriptionRepository;
          }

          return paymentAttemptRepository;
        }),
      } as unknown as EntityManager;

      return Promise.resolve(cb(manager));
    });
  }

  beforeEach(() => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      setOnLocked: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    subscriptionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<Subscription>>;

    paymentAttemptRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<PaymentAttempt>>;

    dataSource = {
      transaction: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;

    paymentsService = {
      createRecurringPendingAttempt: jest.fn(),
      finalizeAttemptSuccess: jest.fn(),
      finalizeAttemptFailure: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    paymentMethodsService = {
      findActiveById: jest.fn(),
      decryptToken: jest.fn(),
    } as unknown as jest.Mocked<PaymentMethodsService>;

    monobankClientService = {
      createRecurringCharge: jest.fn(),
    } as unknown as jest.Mocked<MonobankClientService>;

    service = new RecurringBillingService(
      dataSource,
      paymentsService,
      paymentMethodsService,
      monobankClientService,
    );
  });

  it('applies due subscription selection and locking query', async () => {
    setupTransactionWithDueSequence([null]);

    await service.runDueCharges(1);

    expect(subscriptionRepository.createQueryBuilder).toHaveBeenCalledWith(
      'subscription',
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'subscription.status IN (:...statuses)',
      {
        statuses: [SubscriptionStatus.Active, SubscriptionStatus.PastDue],
      },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'subscription.cancelled_at IS NULL',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'subscription.payment_method_id IS NOT NULL',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'subscription.next_charge_at IS NOT NULL',
    );
    expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(queryBuilder.setOnLocked).toHaveBeenCalledWith('skip_locked');
  });

  it('skips duplicate recurring attempt for same billing period', async () => {
    const due = makeSubscription();
    setupTransactionWithDueSequence([due, null]);

    paymentMethodsService.findActiveById.mockResolvedValue({
      id: 'pm-1',
      cardTokenEncrypted: 'enc',
    } as never);
    paymentAttemptRepository.findOne.mockResolvedValue({
      id: 'attempt-existing',
      billingPeriodKey: 'recurring:sub-1:2026-04',
    } as never);

    const result = await service.runDueCharges(5);

    expect(result.duplicate_skipped).toBe(1);
    expect(monobankClientService.createRecurringCharge).not.toHaveBeenCalled();
  });

  it('processes recurring success flow', async () => {
    const due = makeSubscription();
    setupTransactionWithDueSequence([due, null]);

    paymentAttemptRepository.findOne.mockResolvedValue(null);
    paymentMethodsService.findActiveById.mockResolvedValue({
      id: 'pm-1',
      cardTokenEncrypted: 'enc',
    } as never);
    paymentMethodsService.decryptToken.mockReturnValue('token-1');
    paymentsService.createRecurringPendingAttempt.mockResolvedValue({
      id: 'attempt-1',
    } as never);
    monobankClientService.createRecurringCharge.mockResolvedValue({
      status: 'success',
      providerPaymentId: 'pay-1',
      providerInvoiceId: 'inv-1',
      failureCode: null,
      failureMessage: null,
      providerPayloadJson: {},
    });

    const result = await service.runDueCharges(5);

    expect(result.charged).toBe(1);
    expect(paymentsService.finalizeAttemptSuccess).toHaveBeenCalledWith(
      'attempt-1',
      'pay-1',
    );
    expect(subscriptionRepository.update).toHaveBeenCalledWith(
      { id: 'sub-1' },
      expect.objectContaining({
        status: SubscriptionStatus.Active,
        retryCount: 0,
        lastFailureAt: null,
      }),
    );
  });

  it('processes recurring failure and schedules retry progression', async () => {
    const due = makeSubscription({
      retryCount: 0,
      nextChargeAt: new Date('2026-04-10T09:00:00.000Z'),
      periodEndAt: new Date('2026-04-10T09:00:00.000Z'),
    });
    setupTransactionWithDueSequence([due, null]);

    paymentAttemptRepository.findOne.mockResolvedValue(null);
    paymentMethodsService.findActiveById.mockResolvedValue({
      id: 'pm-1',
      cardTokenEncrypted: 'enc',
    } as never);
    paymentMethodsService.decryptToken.mockReturnValue('token-1');
    paymentsService.createRecurringPendingAttempt.mockResolvedValue({
      id: 'attempt-1',
    } as never);
    monobankClientService.createRecurringCharge.mockResolvedValue({
      status: 'failure',
      providerPaymentId: null,
      providerInvoiceId: null,
      failureCode: 'declined',
      failureMessage: 'Declined',
      providerPayloadJson: {},
    });

    const result = await service.runDueCharges(5);

    expect(result.failed_scheduled_retry).toBe(1);
    expect(paymentsService.finalizeAttemptFailure).toHaveBeenCalledWith(
      'attempt-1',
      'declined',
      'Declined',
    );
    expect(subscriptionRepository.update).toHaveBeenCalledWith(
      { id: 'sub-1' },
      expect.objectContaining({
        status: SubscriptionStatus.PastDue,
        retryCount: 1,
      }),
    );
  });

  it('suspends subscription after max retries exceeded', async () => {
    const due = makeSubscription({
      retryCount: 3,
      maxRetries: 3,
      status: SubscriptionStatus.PastDue,
    });
    setupTransactionWithDueSequence([due, null]);

    paymentAttemptRepository.findOne.mockResolvedValue(null);
    paymentMethodsService.findActiveById.mockResolvedValue({
      id: 'pm-1',
      cardTokenEncrypted: 'enc',
    } as never);
    paymentMethodsService.decryptToken.mockReturnValue('token-1');
    paymentsService.createRecurringPendingAttempt.mockResolvedValue({
      id: 'attempt-1',
    } as never);
    monobankClientService.createRecurringCharge.mockResolvedValue({
      status: 'failure',
      providerPaymentId: null,
      providerInvoiceId: null,
      failureCode: 'declined',
      failureMessage: 'Declined',
      providerPayloadJson: {},
    });

    const result = await service.runDueCharges(5);

    expect(result.suspended).toBe(1);
    expect(subscriptionRepository.update).toHaveBeenCalledWith(
      { id: 'sub-1' },
      expect.objectContaining({
        status: SubscriptionStatus.Suspended,
        nextChargeAt: null,
        retryCount: 4,
      }),
    );
  });

  it('uses deterministic period key and idempotency key for attempt creation', async () => {
    const due = makeSubscription({
      interval: SubscriptionInterval.Yearly,
      retryCount: 2,
      periodEndAt: new Date('2026-04-10T09:00:00.000Z'),
    });
    setupTransactionWithDueSequence([due, null]);

    paymentAttemptRepository.findOne.mockResolvedValue(null);
    paymentMethodsService.findActiveById.mockResolvedValue({
      id: 'pm-1',
      cardTokenEncrypted: 'enc',
    } as never);
    paymentMethodsService.decryptToken.mockReturnValue('token-1');
    paymentsService.createRecurringPendingAttempt.mockResolvedValue({
      id: 'attempt-2',
    } as never);
    monobankClientService.createRecurringCharge.mockResolvedValue({
      status: 'success',
      providerPaymentId: 'pay-2',
      providerInvoiceId: 'inv-2',
      failureCode: null,
      failureMessage: null,
      providerPayloadJson: {},
    });

    await service.runDueCharges(5);

    expect(paymentsService.createRecurringPendingAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        billingPeriodKey: 'recurring:sub-1:2026',
        idempotencyKey: 'rec:sub-1:recurring:sub-1:2026:r2',
        retryNo: 2,
      }),
      expect.anything(),
    );
  });

  it('does not charge cancelled subscriptions', async () => {
    const due = makeSubscription({
      status: SubscriptionStatus.Cancelled,
      cancelledAt: new Date('2026-04-10T09:00:00.000Z'),
    });
    setupTransactionWithDueSequence([due, null]);

    const result = await service.runDueCharges(5);

    expect(result.cancelled_skipped).toBe(1);
    expect(monobankClientService.createRecurringCharge).not.toHaveBeenCalled();
    expect(
      paymentsService.createRecurringPendingAttempt,
    ).not.toHaveBeenCalled();
  });
});

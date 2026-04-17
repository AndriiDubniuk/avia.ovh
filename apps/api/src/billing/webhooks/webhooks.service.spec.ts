import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WebhooksService } from './webhooks.service';
import { MonobankClientService } from '../monobank/monobank-client.service';
import { WebhookEventsService } from './webhook-events.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { BillingEmailService } from '../emails/billing-email.service';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let monobankClientService: jest.Mocked<MonobankClientService>;
  let webhookEventsService: jest.Mocked<WebhookEventsService>;
  let paymentMethodsService: jest.Mocked<PaymentMethodsService>;
  let billingEmailService: jest.Mocked<BillingEmailService>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    monobankClientService = {
      verifyWebhookSignature: jest.fn(),
    } as unknown as jest.Mocked<MonobankClientService>;

    webhookEventsService = {
      createPendingEvent: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn(),
      getFailedEventOrThrow: jest.fn(),
    } as unknown as jest.Mocked<WebhookEventsService>;

    paymentMethodsService = {
      upsertDefaultMonobankToken: jest.fn(),
    } as unknown as jest.Mocked<PaymentMethodsService>;
    billingEmailService = {
      sendPaymentOutcomeEmails: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<BillingEmailService>;

    dataSource = {
      transaction: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;

    service = new WebhooksService(
      monobankClientService,
      webhookEventsService,
      paymentMethodsService,
      billingEmailService,
      dataSource,
    );
  });

  it('rejects invalid signature', async () => {
    monobankClientService.verifyWebhookSignature.mockResolvedValue(false);

    await expect(
      service.handleMonobankWebhook(Buffer.from('{}'), 'bad-sign'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns duplicate when webhook event already exists', async () => {
    monobankClientService.verifyWebhookSignature.mockResolvedValue(true);
    webhookEventsService.createPendingEvent.mockResolvedValue({
      duplicate: true,
      event: null,
    });

    const result = await service.handleMonobankWebhook(
      Buffer.from(
        JSON.stringify({
          invoiceId: 'inv-1',
          status: 'success',
          modifiedDate: '2026-04-15T00:00:00.000Z',
        }),
      ),
      'sig',
    );

    expect(result).toEqual({ ok: true, duplicate: true });
  });

  it('maps success webhook and activates subscription', async () => {
    monobankClientService.verifyWebhookSignature.mockResolvedValue(true);
    webhookEventsService.createPendingEvent.mockResolvedValue({
      duplicate: false,
      event: { id: 'event-1' } as never,
    });

    const checkoutRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'chk-1',
        subscriptionId: 'sub-1',
        providerInvoiceId: 'inv-1',
      }),
      update: jest.fn(),
    };
    const subscriptionRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        clientId: 'client-1',
        status: SubscriptionStatus.PendingInitialPayment,
        interval: SubscriptionInterval.Monthly,
        anchorDay: 15,
      }),
      update: jest.fn(),
    };
    const paymentRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'pay-1' }),
      update: jest.fn(),
    };
    const clientRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'client-1',
        name: 'Test Client',
        email: 'client@example.com',
      }),
    };

    const manager = {
      getRepository: jest.fn((entity: { name?: string }) => {
        if (entity.name === 'CheckoutSession') return checkoutRepo;
        if (entity.name === 'Subscription') return subscriptionRepo;
        if (entity.name === 'Client') return clientRepo;
        return paymentRepo;
      }),
    };

    paymentMethodsService.upsertDefaultMonobankToken.mockResolvedValue({
      id: 'pm-1',
    } as never);

    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager as never),
    );

    const payload = {
      invoiceId: 'inv-1',
      status: 'success',
      modifiedDate: '2026-04-15T00:00:00.000Z',
      walletData: {
        cardToken: 'token-1',
      },
    };

    const result = await service.handleMonobankWebhook(
      Buffer.from(JSON.stringify(payload), 'utf8'),
      'sig',
    );

    expect(result).toEqual({ ok: true });
    expect(checkoutRepo.update).toHaveBeenCalled();
    expect(paymentRepo.update).toHaveBeenCalled();
    expect(subscriptionRepo.update).toHaveBeenCalled();
    expect(webhookEventsService.markProcessed).toHaveBeenCalledWith('event-1');
  });

  it('maps failure/expiry webhook and moves subscription to failed_initial_payment', async () => {
    monobankClientService.verifyWebhookSignature.mockResolvedValue(true);
    webhookEventsService.createPendingEvent.mockResolvedValue({
      duplicate: false,
      event: { id: 'event-2' } as never,
    });

    const checkoutRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'chk-1',
        subscriptionId: 'sub-1',
        providerInvoiceId: 'inv-1',
      }),
      update: jest.fn(),
    };
    const subscriptionRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        status: SubscriptionStatus.PendingInitialPayment,
      }),
      update: jest.fn(),
    };
    const paymentRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'pay-1' }),
      update: jest.fn(),
    };
    const clientRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'client-1',
        name: 'Test Client',
        email: 'client@example.com',
      }),
    };

    const manager = {
      getRepository: jest.fn((entity: { name?: string }) => {
        if (entity.name === 'CheckoutSession') return checkoutRepo;
        if (entity.name === 'Subscription') return subscriptionRepo;
        if (entity.name === 'Client') return clientRepo;
        return paymentRepo;
      }),
    };

    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager as never),
    );

    const payload = {
      invoiceId: 'inv-1',
      status: 'expired',
      modifiedDate: '2026-04-15T00:00:00.000Z',
    };

    const result = await service.handleMonobankWebhook(
      Buffer.from(JSON.stringify(payload), 'utf8'),
      'sig',
    );

    expect(result).toEqual({ ok: true });
    expect(subscriptionRepo.update).toHaveBeenCalledWith(
      { id: 'sub-1' },
      { status: SubscriptionStatus.FailedInitialPayment },
    );
  });

  it('replays failed webhook event', async () => {
    webhookEventsService.getFailedEventOrThrow.mockResolvedValue({
      id: 'event-3',
      payloadJson: {
        invoiceId: 'inv-1',
        status: 'failure',
        modifiedDate: '2026-04-15T00:00:00.000Z',
      },
    } as never);

    const checkoutRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'chk-1',
        subscriptionId: 'sub-1',
      }),
      update: jest.fn(),
    };
    const subscriptionRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        status: SubscriptionStatus.PendingInitialPayment,
      }),
      update: jest.fn(),
    };
    const paymentRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'pay-1' }),
      update: jest.fn(),
    };
    const clientRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'client-1',
        name: 'Test Client',
        email: 'client@example.com',
      }),
    };

    const manager = {
      getRepository: jest.fn((entity: { name?: string }) => {
        if (entity.name === 'CheckoutSession') return checkoutRepo;
        if (entity.name === 'Subscription') return subscriptionRepo;
        if (entity.name === 'Client') return clientRepo;
        return paymentRepo;
      }),
    };

    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager as never),
    );

    const result = await service.replayFailedEvent('event-3');

    expect(result).toEqual({ ok: true, replayed: true });
    expect(webhookEventsService.markProcessed).toHaveBeenCalledWith('event-3');
  });

  it('marks webhook event as failed when processing throws', async () => {
    monobankClientService.verifyWebhookSignature.mockResolvedValue(true);
    webhookEventsService.createPendingEvent.mockResolvedValue({
      duplicate: false,
      event: { id: 'event-4' } as never,
    });

    const manager = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      }),
    };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager as never),
    );

    await expect(
      service.handleMonobankWebhook(
        Buffer.from(
          JSON.stringify({
            invoiceId: 'inv-404',
            status: 'success',
            modifiedDate: '2026-04-15T00:00:00.000Z',
          }),
        ),
        'sig',
      ),
    ).rejects.toBeTruthy();

    expect(webhookEventsService.markFailed).toHaveBeenCalledWith(
      'event-4',
      expect.any(String),
    );
  });

  it('does not reactivate cancelled subscription on late success webhook', async () => {
    monobankClientService.verifyWebhookSignature.mockResolvedValue(true);
    webhookEventsService.createPendingEvent.mockResolvedValue({
      duplicate: false,
      event: { id: 'event-5' } as never,
    });

    const checkoutRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'chk-1',
        subscriptionId: 'sub-1',
        providerInvoiceId: 'inv-1',
      }),
      update: jest.fn(),
    };
    const subscriptionRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        clientId: 'client-1',
        status: SubscriptionStatus.Cancelled,
      }),
      update: jest.fn(),
    };
    const paymentRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'pay-1' }),
      update: jest.fn(),
    };
    const clientRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'client-1',
        name: 'Test Client',
        email: 'client@example.com',
      }),
    };

    const manager = {
      getRepository: jest.fn((entity: { name?: string }) => {
        if (entity.name === 'CheckoutSession') return checkoutRepo;
        if (entity.name === 'Subscription') return subscriptionRepo;
        if (entity.name === 'Client') return clientRepo;
        return paymentRepo;
      }),
    };

    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager as never),
    );

    const result = await service.handleMonobankWebhook(
      Buffer.from(
        JSON.stringify({
          invoiceId: 'inv-1',
          status: 'success',
          modifiedDate: '2026-04-16T00:00:00.000Z',
          walletData: {
            cardToken: 'token-1',
          },
        }),
        'utf8',
      ),
      'sig',
    );

    expect(result).toEqual({ ok: true });
    expect(subscriptionRepo.update).not.toHaveBeenCalled();
    expect(paymentRepo.update).not.toHaveBeenCalled();
    expect(checkoutRepo.update).not.toHaveBeenCalled();
    expect(
      paymentMethodsService.upsertDefaultMonobankToken,
    ).not.toHaveBeenCalled();
  });
});

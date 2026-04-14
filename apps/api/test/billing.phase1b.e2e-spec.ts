import { INestApplication, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { SubscriptionsController } from '../src/billing/subscriptions/subscriptions.controller';
import { CheckoutController } from '../src/billing/checkout/checkout.controller';
import { PaymentsController } from '../src/billing/payments/payments.controller';
import { SubscriptionsService } from '../src/billing/subscriptions/subscriptions.service';
import { CheckoutService } from '../src/billing/checkout/checkout.service';
import { PaymentsService } from '../src/billing/payments/payments.service';
import { IdempotencyInterceptor } from '../src/billing/idempotency/idempotency.interceptor';
import { IdempotencyService } from '../src/billing/idempotency/idempotency.service';

class InMemoryIdempotencyService {
  private readonly records = new Map<string, {
    requestHash: string;
    responseStatus: number;
    responseJson: Record<string, unknown>;
  }>();

  async findByKeyAndRoute(idempotencyKey: string, route: string) {
    return this.records.get(`${idempotencyKey}:${route}`) ?? null;
  }

  async saveRecord(input: {
    idempotencyKey: string;
    route: string;
    requestHash: string;
    responseStatus: number;
    responseJson: Record<string, unknown>;
  }) {
    this.records.set(`${input.idempotencyKey}:${input.route}`, {
      requestHash: input.requestHash,
      responseStatus: input.responseStatus,
      responseJson: input.responseJson,
    });

    return input;
  }
}

describe('Billing Phase 1B (e2e)', () => {
  let app: INestApplication;
  const subscriptionsService = {
    createSubscription: jest.fn(),
    getSubscription: jest.fn(),
    findByIdOrFail: jest.fn(),
  };
  const checkoutService = {
    createCheckoutSession: jest.fn(),
  };
  const paymentsService = {
    listBySubscriptionId: jest.fn(),
  };

  beforeEach(async () => {
    subscriptionsService.createSubscription.mockResolvedValue({
      subscription_id: 'sub-1',
      status: 'pending_initial_payment',
      client_id: 'client-1',
      payment_method_id: null,
      amount_minor: 1200,
      currency: 'UAH',
      interval: 'monthly',
      next_charge_at: null,
      cancelled_at: null,
      created_at: '2026-04-14T00:00:00.000Z',
    });

    subscriptionsService.getSubscription.mockResolvedValue({
      subscription_id: 'sub-1',
      status: 'pending_initial_payment',
      client_id: 'client-1',
      payment_method_id: null,
      amount_minor: 1200,
      currency: 'UAH',
      interval: 'monthly',
      next_charge_at: null,
      cancelled_at: null,
      created_at: '2026-04-14T00:00:00.000Z',
    });

    subscriptionsService.findByIdOrFail.mockResolvedValue({ id: 'sub-1' });

    checkoutService.createCheckoutSession.mockImplementation(async (id: string) => {
      if (id === 'bad-status') {
        throw new UnprocessableEntityException('invalid state');
      }

      return {
        checkout_session_id: 'chk-1',
        provider: 'monobank',
        provider_invoice_id: 'inv-1',
        checkout_url: 'https://pay.example',
        status: 'created',
        expires_at: '2026-04-14T00:30:00.000Z',
      };
    });

    paymentsService.listBySubscriptionId.mockResolvedValue([
      {
        id: 'pay-1',
        type: 'initial',
        status: 'pending',
        amountMinor: 1200,
        currency: 'UAH',
        billingPeriodKey: 'initial:chk-1',
        createdAt: new Date('2026-04-14T00:00:00.000Z'),
        finalizedAt: null,
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      controllers: [
        SubscriptionsController,
        CheckoutController,
        PaymentsController,
      ],
      providers: [
        Reflector,
        IdempotencyInterceptor,
        {
          provide: IdempotencyService,
          useClass: InMemoryIdempotencyService,
        },
        {
          provide: SubscriptionsService,
          useValue: subscriptionsService,
        },
        {
          provide: CheckoutService,
          useValue: checkoutService,
        },
        {
          provide: PaymentsService,
          useValue: paymentsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('creates subscription (201)', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/subscriptions')
      .set('Idempotency-Key', 'create-1')
      .send({
        client: {
          external_ref: 'crm-1',
          name: 'Acme',
          email: 'billing@acme.ua',
        },
        plan: {
          amount_minor: 1200,
          currency: 'UAH',
          interval: 'monthly',
        },
        timezone: 'Europe/Kyiv',
        start_mode: 'immediate',
      })
      .expect(201);
  });

  it('returns validation error (400)', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/subscriptions')
      .set('Idempotency-Key', 'create-2')
      .send({
        client: {
          external_ref: 'crm-1',
        },
      })
      .expect(400);
  });

  it('replays idempotent response (201 + header)', async () => {
    const payload = {
      client: {
        external_ref: 'crm-3',
        name: 'Acme',
        email: 'billing@acme.ua',
      },
      plan: {
        amount_minor: 1200,
        currency: 'UAH',
        interval: 'monthly',
      },
      start_mode: 'immediate',
    };

    await request(app.getHttpServer())
      .post('/v1/billing/subscriptions')
      .set('Idempotency-Key', 'create-3')
      .send(payload)
      .expect(201);

    const replay = await request(app.getHttpServer())
      .post('/v1/billing/subscriptions')
      .set('Idempotency-Key', 'create-3')
      .send(payload)
      .expect(201);

    expect(replay.headers['idempotency-replayed']).toBe('true');
  });

  it('returns idempotency conflict (409)', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/subscriptions')
      .set('Idempotency-Key', 'create-4')
      .send({
        client: {
          external_ref: 'crm-4',
          name: 'Acme',
          email: 'billing@acme.ua',
        },
        plan: {
          amount_minor: 1200,
          currency: 'UAH',
          interval: 'monthly',
        },
        start_mode: 'immediate',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/billing/subscriptions')
      .set('Idempotency-Key', 'create-4')
      .send({
        client: {
          external_ref: 'crm-4',
          name: 'Acme',
          email: 'billing@acme.ua',
        },
        plan: {
          amount_minor: 2400,
          currency: 'UAH',
          interval: 'yearly',
        },
        start_mode: 'immediate',
      })
      .expect(409);
  });

  it('creates checkout from pending state', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/subscriptions/sub-1/checkout-session')
      .set('Idempotency-Key', 'checkout-1')
      .send({
        return_url: 'https://avia.ovh/billing/return',
        tokenization_requested: true,
      })
      .expect(201);
  });

  it('returns 422 for invalid checkout state', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/subscriptions/bad-status/checkout-session')
      .set('Idempotency-Key', 'checkout-2')
      .send({
        return_url: 'https://avia.ovh/billing/return',
        tokenization_requested: true,
      })
      .expect(422);
  });

  it('gets subscription', async () => {
    await request(app.getHttpServer())
      .get('/v1/billing/subscriptions/sub-1')
      .expect(200);
  });

  it('gets payment attempts list', async () => {
    await request(app.getHttpServer())
      .get('/v1/billing/subscriptions/sub-1/payment-attempts')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body.items)).toBe(true);
      });
  });
});

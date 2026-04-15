import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { SubscriptionsController } from '../src/billing/subscriptions/subscriptions.controller';
import { SubscriptionsService } from '../src/billing/subscriptions/subscriptions.service';
import { SubscriptionStatus } from '../src/billing/subscriptions/enums/subscription-status.enum';

describe('Billing Phase 1E cancellation flow (e2e)', () => {
  let app: INestApplication;
  const subscriptionsService = {
    createSubscription: jest.fn(),
    getSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  beforeEach(async () => {
    subscriptionsService.cancelSubscription.mockResolvedValue({
      subscription_id: 'sub-1',
      status: SubscriptionStatus.Cancelled,
      client_id: 'client-1',
      payment_method_id: 'pm-1',
      amount_minor: 29900,
      currency: 'UAH',
      interval: 'monthly',
      next_charge_at: null,
      cancelled_at: '2026-04-14T10:00:00.000Z',
      created_at: '2026-04-01T10:00:00.000Z',
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: subscriptionsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('cancels subscription via API endpoint', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/subscriptions/sub-1/cancel')
      .expect(201)
      .expect(
        ({
          body,
        }: {
          body: {
            status: string;
            subscription_id: string;
            next_charge_at: null;
          };
        }) => {
          expect(body.subscription_id).toBe('sub-1');
          expect(body.status).toBe(SubscriptionStatus.Cancelled);
          expect(body.next_charge_at).toBeNull();
        },
      );
  });
});

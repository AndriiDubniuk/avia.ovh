import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          name: 'AVIA Digital API',
          status: 'ok',
          endpoints: {
            health: '/v1/health',
            contactRequests: '/v1/contact-requests',
            billingPlans: '/v1/billing/plans',
            billingCheckouts: '/v1/billing/checkouts',
            billingCheckoutById: '/v1/billing/checkouts/:checkoutId',
            billingSubscriptions: '/v1/billing/subscriptions',
            billingCheckoutSession:
              '/v1/billing/subscriptions/:id/checkout-session',
            billingPaymentAttempts:
              '/v1/billing/subscriptions/:id/payment-attempts',
          },
        });
      });
  });
});

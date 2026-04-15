import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API info', () => {
      expect(appController.getInfo()).toEqual({
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

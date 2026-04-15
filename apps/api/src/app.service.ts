import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
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
    };
  }
}

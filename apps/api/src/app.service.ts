import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'AVIA Digital API',
      status: 'ok',
      endpoints: {
        health: '/health',
        contactRequests: '/contact-requests',
        billingPlans: '/billing/plans',
        billingCheckouts: '/billing/checkouts',
      },
    };
  }
}

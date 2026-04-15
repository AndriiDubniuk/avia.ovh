import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RecurringBillingController } from '../src/billing/recurring/recurring-billing.controller';
import { RecurringBillingService } from '../src/billing/recurring/recurring-billing.service';

describe('Billing Phase 1D recurring engine (e2e)', () => {
  let app: INestApplication;
  const recurringBillingService = {
    runDueCharges: jest.fn(),
  };

  beforeEach(async () => {
    recurringBillingService.runDueCharges.mockResolvedValue({
      ok: true,
      processed: 2,
      charged: 1,
      failed_scheduled_retry: 1,
      suspended: 0,
      duplicate_skipped: 0,
      missing_payment_method: 0,
      items: [
        { subscriptionId: 'sub-1', outcome: 'charged' },
        { subscriptionId: 'sub-2', outcome: 'failed_scheduled_retry' },
      ],
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [RecurringBillingController],
      providers: [
        {
          provide: RecurringBillingService,
          useValue: recurringBillingService,
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

  it('runs due recurring charges via internal endpoint', async () => {
    await request(app.getHttpServer())
      .post('/v1/internal/billing/run-due-charges')
      .expect(201)
      .expect(({ body }: { body: { ok: boolean; processed: number } }) => {
        expect(body.ok).toBe(true);
        expect(body.processed).toBe(2);
      });
  });
});

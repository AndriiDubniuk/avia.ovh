import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { PaymentAttempt } from '../payments/entities/payment-attempt.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { BillingEmailService } from './billing-email.service';
import { BillingEmailEvent } from './entities/billing-email-event.entity';
import { ResendEmailService } from './resend-email.service';

function createRepositoryMock<T>() {
  return {
    create: jest.fn((input) => input),
    save: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('BillingEmailService', () => {
  let service: BillingEmailService;
  let emailEventsRepository: jest.Mocked<Repository<BillingEmailEvent>>;
  let resendEmailService: jest.Mocked<ResendEmailService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BillingEmailService,
        {
          provide: getRepositoryToken(BillingEmailEvent),
          useValue: createRepositoryMock<BillingEmailEvent>(),
        },
        {
          provide: ResendEmailService,
          useValue: {
            send: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'BILLING_NOTIFICATION_TO_EMAIL') {
                return 'owner@avia.ovh';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(BillingEmailService);
    emailEventsRepository = module.get(getRepositoryToken(BillingEmailEvent));
    resendEmailService = module.get(ResendEmailService);
  });

  it('sends customer and internal outcome emails', async () => {
    emailEventsRepository.save.mockResolvedValue({} as BillingEmailEvent);

    await service.sendPaymentOutcomeEmails({
      kind: 'initial_success',
      eventKey: 'initial:attempt-1:success',
      subscription: {
        id: 'sub-1',
        status: SubscriptionStatus.Active,
        amountMinor: 29900,
        currency: 'UAH',
        interval: SubscriptionInterval.Yearly,
        nextChargeAt: new Date('2026-05-01T00:00:00.000Z'),
      } as Subscription,
      paymentAttempt: {
        id: 'attempt-1',
        checkoutSessionId: 'chk-1',
      } as PaymentAttempt,
      client: {
        name: 'Client',
        email: 'client@example.com',
      } as Client,
      checkoutId: 'chk-1',
    });

    expect(resendEmailService.send).toHaveBeenCalledTimes(2);
  });
});

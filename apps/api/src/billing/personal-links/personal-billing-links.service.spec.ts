import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingService } from '../billing.service';
import { PersonalBillingLink } from './entities/personal-billing-link.entity';
import { PersonalBillingLinksService } from './personal-billing-links.service';

function createRepositoryMock<T>() {
  return {
    create: jest.fn((input) => input),
    save: jest.fn(),
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('PersonalBillingLinksService', () => {
  let service: PersonalBillingLinksService;
  let repository: jest.Mocked<Repository<PersonalBillingLink>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PersonalBillingLinksService,
        {
          provide: getRepositoryToken(PersonalBillingLink),
          useValue: createRepositoryMock<PersonalBillingLink>(),
        },
        {
          provide: BillingService,
          useValue: {
            createCheckout: jest.fn().mockResolvedValue({
              checkoutId: 'chk_1',
              subscriptionId: 'sub_1',
              paymentUrl: 'http://pay.local/url',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, string> = {
                BILLING_PERSONAL_LINK_TTL_HOURS: '72',
                BILLING_PUBLIC_URL: 'http://localhost:3002',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PersonalBillingLinksService);
    repository = module.get(getRepositoryToken(PersonalBillingLink));
  });

  it('creates tokenized personal url', async () => {
    repository.save.mockResolvedValue({
      id: 'link-1',
      customerName: 'Client',
      customerEmail: 'client@example.com',
      expiresAt: new Date('2026-04-20T00:00:00.000Z'),
    } as PersonalBillingLink);

    const result = await service.createLink({
      planCode: 'annual',
      customerName: 'Client',
      customerEmail: 'client@example.com',
    });

    expect(result.link_id).toBe('link-1');
    expect(result.personal_url).toContain('/pay/');
  });

  it('rejects unknown personal token', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.getOfferByToken('bad-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

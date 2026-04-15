import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  PortalAccessToken,
  PortalAccessTokenType,
} from './entities/portal-access-token.entity';
import { PortalService } from './portal.service';

function createRepositoryMock<T>() {
  return {
    create: jest.fn((input) => input),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('PortalService', () => {
  let service: PortalService;
  let tokensRepository: jest.Mocked<Repository<PortalAccessToken>>;
  let clientsRepository: jest.Mocked<Repository<Client>>;
  let subscriptionsRepository: jest.Mocked<Repository<Subscription>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PortalService,
        {
          provide: getRepositoryToken(PortalAccessToken),
          useValue: createRepositoryMock<PortalAccessToken>(),
        },
        {
          provide: getRepositoryToken(Client),
          useValue: createRepositoryMock<Client>(),
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: createRepositoryMock<Subscription>(),
        },
        {
          provide: SubscriptionsService,
          useValue: {
            getSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                BILLING_PUBLIC_URL: 'http://localhost:3002',
                BILLING_PORTAL_COOKIE_NAME: 'billing_portal_session',
                BILLING_PORTAL_MAGIC_TTL_MINUTES: '15',
                BILLING_PORTAL_SESSION_TTL_HOURS: '24',
                APP_ENV: 'local',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PortalService);
    tokensRepository = module.get(getRepositoryToken(PortalAccessToken));
    clientsRepository = module.get(getRepositoryToken(Client));
    subscriptionsRepository = module.get(getRepositoryToken(Subscription));
  });

  it('returns generic success message when requesting magic link', async () => {
    tokensRepository.save.mockResolvedValue({} as PortalAccessToken);

    const result = await service.requestLink('Client@example.com');

    expect(result.ok).toBe(true);
    expect(result.message).toContain('If this email is registered');
    expect(tokensRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects missing portal session when listing subscriptions', async () => {
    await expect(
      service.listSubscriptions({
        headers: {},
      } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns empty list when no client bound to session email', async () => {
    tokensRepository.findOne.mockResolvedValue({
      email: 'customer@example.com',
      tokenType: PortalAccessTokenType.Session,
    } as PortalAccessToken);
    clientsRepository.find.mockResolvedValue([]);

    const result = await service.listSubscriptions({
      headers: {
        cookie: 'billing_portal_session=session-token',
      },
    } as never);

    expect(result.items).toEqual([]);
  });

  it('returns subscriptions for authorized portal session', async () => {
    tokensRepository.findOne.mockResolvedValue({
      email: 'customer@example.com',
      tokenType: PortalAccessTokenType.Session,
    } as PortalAccessToken);
    clientsRepository.find.mockResolvedValue([
      {
        id: 'client-1',
        email: 'customer@example.com',
      } as Client,
    ]);
    subscriptionsRepository.find.mockResolvedValue([
      {
        id: 'sub-1',
        status: 'active',
        amountMinor: 29900,
        currency: 'UAH',
        interval: 'yearly',
        nextChargeAt: null,
        cancelledAt: null,
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
      } as unknown as Subscription,
    ]);

    const result = await service.listSubscriptions({
      headers: {
        cookie: 'billing_portal_session=session-token',
      },
    } as never);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.subscription_id).toBe('sub-1');
  });
});

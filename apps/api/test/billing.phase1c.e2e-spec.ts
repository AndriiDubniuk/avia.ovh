import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { WebhooksController } from '../src/billing/webhooks/webhooks.controller';
import { InternalWebhooksController } from '../src/billing/webhooks/internal-webhooks.controller';
import { WebhooksService } from '../src/billing/webhooks/webhooks.service';

describe('Billing Phase 1C webhooks (e2e)', () => {
  let app: INestApplication;
  const webhooksService = {
    handleMonobankWebhook: jest.fn(),
    replayFailedEvent: jest.fn(),
  };

  beforeEach(async () => {
    webhooksService.handleMonobankWebhook.mockImplementation(
      async (_rawBody: Buffer, signature: string) => {
        if (signature === 'invalid') {
          throw new UnauthorizedException(
            'Invalid monobank webhook signature.',
          );
        }

        if (signature === 'duplicate') {
          return { ok: true, duplicate: true };
        }

        if (signature === 'failure') {
          return { ok: true, mapped: 'failed_initial_payment' };
        }

        return { ok: true, mapped: 'active' };
      },
    );

    webhooksService.replayFailedEvent.mockResolvedValue({
      ok: true,
      replayed: true,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [WebhooksController, InternalWebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: webhooksService,
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

  it('accepts valid webhook', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/webhooks/monobank')
      .set('x-sign', 'valid')
      .send({ invoiceId: 'inv-1', status: 'success' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.ok).toBe(true);
      });
  });

  it('rejects invalid signature', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/webhooks/monobank')
      .set('x-sign', 'invalid')
      .send({ invoiceId: 'inv-1', status: 'success' })
      .expect(401);
  });

  it('returns duplicate response', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/webhooks/monobank')
      .set('x-sign', 'duplicate')
      .send({ invoiceId: 'inv-1', status: 'success' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.duplicate).toBe(true);
      });
  });

  it('maps failure/expiry responses', async () => {
    await request(app.getHttpServer())
      .post('/v1/billing/webhooks/monobank')
      .set('x-sign', 'failure')
      .send({ invoiceId: 'inv-1', status: 'expired' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.mapped).toBe('failed_initial_payment');
      });
  });

  it('replays failed webhook event', async () => {
    await request(app.getHttpServer())
      .post('/v1/internal/billing/webhooks/replay/event-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.replayed).toBe(true);
      });
  });
});

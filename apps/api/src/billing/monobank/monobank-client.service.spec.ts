import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { generateKeyPairSync, createSign } from 'crypto';
import { MonobankClientService } from './monobank-client.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('MonobankClientService', () => {
  let service: MonobankClientService;
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'MONOBANK_TOKEN') return 'token';
        if (key === 'MONOBANK_API_BASE_URL') return 'https://api.monobank.ua';
        if (key === 'MONOBANK_MODE') return 'mock';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    service = new MonobankClientService(configService, httpService);
  });

  it('verifies valid signature', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    const payload = Buffer.from(JSON.stringify({ invoiceId: 'inv-1' }), 'utf8');
    const sign = createSign('SHA256');
    sign.update(payload);
    sign.end();

    const signature = sign.sign(privateKey).toString('base64');
    const publicPem = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();

    httpService.get.mockReturnValue(
      of({
        data: { key: Buffer.from(publicPem, 'utf8').toString('base64') },
      } as never),
    );

    await expect(
      service.verifyWebhookSignature(payload, signature),
    ).resolves.toBe(true);
  });

  it('returns false for invalid signature', async () => {
    const { publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    const publicPem = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();
    httpService.get.mockReturnValue(
      of({
        data: { key: Buffer.from(publicPem, 'utf8').toString('base64') },
      } as never),
    );

    const payload = Buffer.from(JSON.stringify({ invoiceId: 'inv-1' }), 'utf8');

    await expect(
      service.verifyWebhookSignature(
        payload,
        Buffer.from('invalid').toString('base64'),
      ),
    ).resolves.toBe(false);
  });

  it('maps recurring charge success response', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          status: 'success',
          paymentId: 'pay-1',
          invoiceId: 'inv-1',
        },
      } as never),
    );

    const result = await service.createRecurringCharge({
      amountMinor: 29900,
      currency: 'UAH',
      reference: 'sub-1:2026-04',
      cardToken: 'token-1',
      idempotencyKey: 'idem-1',
    });

    expect(result.status).toBe('success');
    expect(result.providerPaymentId).toBe('pay-1');
  });

  it('maps recurring charge failure response', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          status: 'failure',
          errCode: 'declined',
          errText: 'Declined',
        },
      } as never),
    );

    const result = await service.createRecurringCharge({
      amountMinor: 29900,
      currency: 'UAH',
      reference: 'sub-1:2026-04',
      cardToken: 'token-1',
      idempotencyKey: 'idem-2',
    });

    expect(result.status).toBe('failure');
    expect(result.failureCode).toBe('declined');
  });

  it('throws clear error in real mode when token is missing', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'MONOBANK_MODE') return 'real';
      if (key === 'MONOBANK_TOKEN') return '';
      if (key === 'MONOBANK_API_BASE_URL') return 'https://api.monobank.ua';
      return undefined;
    });

    await expect(
      service.createInvoice({
        amountMinor: 29900,
        currency: 'UAH',
        reference: 'sub-1',
        redirectUrl: 'https://example.com/return',
        tokenizationRequested: true,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(
      service.createInvoice({
        amountMinor: 29900,
        currency: 'UAH',
        reference: 'sub-1',
        redirectUrl: 'https://example.com/return',
        tokenizationRequested: true,
      }),
    ).rejects.toThrow('MONOBANK_TOKEN is required for MONOBANK_MODE=real.');
  });
});

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createPublicKey, createVerify } from 'crypto';

export interface MonobankCreateInvoiceArgs {
  amountMinor: number;
  currency: string;
  reference: string;
  redirectUrl: string;
  tokenizationRequested: boolean;
}

export interface MonobankRecurringChargeArgs {
  amountMinor: number;
  currency: string;
  reference: string;
  cardToken: string;
  idempotencyKey: string;
}

export interface MonobankRecurringChargeResult {
  status: 'success' | 'failure';
  providerPaymentId: string | null;
  providerInvoiceId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  providerPayloadJson: Record<string, unknown>;
}

interface MonobankInvoiceResponse {
  invoiceId?: string;
  pageUrl?: string;
  finalDate?: string;
  [key: string]: unknown;
}

interface MonobankRecurringChargeResponse {
  status?: string;
  paymentId?: string;
  invoiceId?: string;
  errCode?: string;
  errText?: string;
  [key: string]: unknown;
}

@Injectable()
export class MonobankClientService {
  private cachedPublicKey: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async createInvoice(args: MonobankCreateInvoiceArgs) {
    const token = this.getRequiredRealModeToken();
    const webHookUrl = this.getRequiredRealModeWebhookUrl();
    const baseUrl = this.configService.get<string>('MONOBANK_API_BASE_URL');

    if (!token || !baseUrl) {
      throw new ServiceUnavailableException(
        'Monobank integration is not configured.',
      );
    }

    const payload = {
      amount: args.amountMinor,
      ccy: 980,
      reference: args.reference,
      redirectUrl: args.redirectUrl,
      merchantPaymInfo: {
        destination: 'Recurring subscription payment',
        comment: `subscription:${args.reference}`,
      },
      webHookUrl,
      saveCardData: {
        saveCard: args.tokenizationRequested,
      },
    };

    const response = await firstValueFrom(
      this.httpService.post<MonobankInvoiceResponse>(
        `${baseUrl}/api/merchant/invoice/create`,
        payload,
        {
          headers: {
            'X-Token': token,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
        },
      ),
    );

    const invoiceId = response.data.invoiceId;
    const pageUrl = response.data.pageUrl;

    if (!invoiceId || !pageUrl) {
      throw new ServiceUnavailableException(
        'Monobank returned invalid invoice data.',
      );
    }

    const expiryRaw = response.data.finalDate;
    const expiresAt = expiryRaw
      ? new Date(expiryRaw)
      : new Date(Date.now() + 30 * 60 * 1000);

    return {
      providerInvoiceId: invoiceId,
      checkoutUrl: pageUrl,
      expiresAt,
      providerPayloadJson: response.data as Record<string, unknown>,
    };
  }

  async createRecurringCharge(
    args: MonobankRecurringChargeArgs,
  ): Promise<MonobankRecurringChargeResult> {
    const token = this.getRequiredRealModeToken();
    const webHookUrl = this.getRequiredRealModeWebhookUrl();
    const baseUrl = this.configService.get<string>('MONOBANK_API_BASE_URL');

    if (!token || !baseUrl) {
      throw new ServiceUnavailableException(
        'Monobank integration is not configured.',
      );
    }

    const payload = {
      amount: args.amountMinor,
      ccy: 980,
      reference: args.reference,
      merchantPaymInfo: {
        destination: 'Recurring subscription payment',
        comment: `subscription:${args.reference}`,
      },
      webHookUrl,
      walletData: {
        cardToken: args.cardToken,
      },
    };

    const response = await firstValueFrom(
      this.httpService.post<MonobankRecurringChargeResponse>(
        `${baseUrl}/api/merchant/invoice/create`,
        payload,
        {
          headers: {
            'X-Token': token,
            'X-Idempotency-Key': args.idempotencyKey,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
        },
      ),
    );

    const providerPayloadJson = response.data as Record<string, unknown>;
    const rawStatus = (response.data.status ?? '').toLowerCase();

    if (
      rawStatus === 'failure' ||
      rawStatus === 'failed' ||
      rawStatus === 'expired'
    ) {
      return {
        status: 'failure',
        providerPaymentId: response.data.paymentId ?? null,
        providerInvoiceId: response.data.invoiceId ?? null,
        failureCode: response.data.errCode ?? rawStatus,
        failureMessage: response.data.errText ?? 'Recurring charge failed.',
        providerPayloadJson,
      };
    }

    return {
      status: 'success',
      providerPaymentId:
        response.data.paymentId ?? response.data.invoiceId ?? null,
      providerInvoiceId: response.data.invoiceId ?? null,
      failureCode: null,
      failureMessage: null,
      providerPayloadJson,
    };
  }

  async verifyWebhookSignature(rawBody: Buffer, signature: string) {
    if (!signature) {
      return false;
    }

    const isValidWithCurrentKey = await this.verifyWithCurrentKey(
      rawBody,
      signature,
    );

    if (isValidWithCurrentKey) {
      return true;
    }

    this.cachedPublicKey = null;

    return this.verifyWithCurrentKey(rawBody, signature);
  }

  private async verifyWithCurrentKey(rawBody: Buffer, signature: string) {
    const publicKey = await this.getPublicKey();
    const verifier = createVerify('SHA256');

    verifier.update(rawBody);
    verifier.end();

    return verifier.verify(
      createPublicKey(publicKey),
      Buffer.from(signature, 'base64'),
    );
  }

  private async getPublicKey() {
    if (!this.cachedPublicKey) {
      const token = this.getRequiredRealModeToken();
      const baseUrl = this.configService.get<string>('MONOBANK_API_BASE_URL');

      if (!token || !baseUrl) {
        throw new ServiceUnavailableException(
          'Monobank integration is not configured.',
        );
      }

      const response = await firstValueFrom(
        this.httpService.get<{ key: string }>(
          `${baseUrl}/api/merchant/pubkey`,
          {
            headers: {
              'X-Token': token,
            },
            timeout: 10_000,
          },
        ),
      );

      this.cachedPublicKey = Buffer.from(response.data.key, 'base64').toString(
        'utf-8',
      );
    }

    return this.cachedPublicKey;
  }

  private getRequiredRealModeToken() {
    const mode = (this.configService.get<string>('MONOBANK_MODE') ?? 'mock')
      .trim()
      .toLowerCase();
    const token = this.configService.get<string>('MONOBANK_TOKEN') ?? '';
    const normalizedToken = token.trim().toLowerCase();

    const placeholders = new Set([
      '',
      'your_token',
      'your-monobank-token',
      'changeme',
      'placeholder',
    ]);

    if (mode === 'real' && placeholders.has(normalizedToken)) {
      throw new ServiceUnavailableException(
        'MONOBANK_TOKEN is required for MONOBANK_MODE=real.',
      );
    }

    if (placeholders.has(normalizedToken)) {
      throw new ServiceUnavailableException(
        'Monobank integration is not configured.',
      );
    }

    return token;
  }

  private getRequiredRealModeWebhookUrl() {
    const mode = (this.configService.get<string>('MONOBANK_MODE') ?? 'mock')
      .trim()
      .toLowerCase();
    const webHookUrl =
      this.configService.get<string>('MONOBANK_WEBHOOK_URL') ?? '';
    const normalized = webHookUrl.trim();

    if (mode !== 'real') {
      return normalized;
    }

    if (!normalized) {
      throw new ServiceUnavailableException(
        'MONOBANK_WEBHOOK_URL is required for MONOBANK_MODE=real.',
      );
    }

    try {
      const parsed = new URL(normalized);
      if (!parsed.protocol || !parsed.host) {
        throw new Error('Invalid URL');
      }
    } catch {
      throw new ServiceUnavailableException(
        'MONOBANK_WEBHOOK_URL must be a valid URL in MONOBANK_MODE=real.',
      );
    }

    return normalized;
  }
}

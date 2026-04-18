import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createPublicKey, createVerify } from 'crypto';

type CreateSubscriptionPayload = {
  amount: number;
  ccy: number;
  reference?: string;
  redirectUrl: string;
  webHookUrls: {
    chargeUrl: string;
    statusUrl: string;
  };
  interval: string;
  validity: number;
};

type SubscriptionStatusResponse = {
  subscriptionId: string;
  status: string;
  startDate?: string;
  endDate?: string;
  amount: number;
  ccy: number;
  interval: string;
  nextChargeDate?: string;
  cancellationDesc?: string;
  summary?: {
    totalPaid?: number;
    totalFailed?: number;
  };
  walletData?: {
    status?: string;
    failureDescription?: string;
    walletId?: string;
  };
};

type MonobankErrorResponse = {
  errCode?: string;
  errText?: string;
};

@Injectable()
export class MonobankAcquiringService {
  private readonly apiBaseUrl =
    process.env.MONOBANK_API_BASE_URL ?? 'https://api.monobank.ua';

  private cachedPublicKey: string | null = null;

  async createSubscription(payload: CreateSubscriptionPayload) {
    return this.request<{ subscriptionId: string; pageUrl: string }>(
      '/api/merchant/subscription/create',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  }

  async getSubscriptionStatus(subscriptionId: string) {
    const params = new URLSearchParams({ subscriptionId });

    return this.request<SubscriptionStatusResponse>(
      `/api/merchant/subscription/status?${params.toString()}`,
    );
  }

  async cancelSubscription(subscriptionId: string, refundAmount?: number) {
    return this.request<void>('/api/merchant/subscription/edit', {
      method: 'POST',
      body: JSON.stringify({
        subscriptionId,
        action: 'cancel',
        ...(typeof refundAmount === 'number' ? { refundAmount } : {}),
      }),
    });
  }

  async removeSubscription(subscriptionId: string) {
    return this.request<void>('/api/merchant/subscription/remove', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId }),
    });
  }

  async verifyWebhookSignature(rawBody: Buffer, xSign: string) {
    if (!xSign) {
      return false;
    }

    const isValid = await this.verifyWithCurrentKey(rawBody, xSign);

    if (isValid) {
      return true;
    }

    this.cachedPublicKey = null;

    return this.verifyWithCurrentKey(rawBody, xSign);
  }

  private async verifyWithCurrentKey(rawBody: Buffer, xSign: string) {
    const publicKey = await this.getPublicKey();
    const signature = Buffer.from(xSign, 'base64');
    const verifier = createVerify('SHA256');

    verifier.update(rawBody);
    verifier.end();

    return verifier.verify(createPublicKey(publicKey), signature);
  }

  private async getPublicKey() {
    if (!this.cachedPublicKey) {
      const response = await this.request<{ key: string }>(
        '/api/merchant/pubkey',
      );

      this.cachedPublicKey = Buffer.from(response.key, 'base64').toString(
        'utf-8',
      );
    }

    return this.cachedPublicKey;
  }

  private async request<T>(path: string, init?: RequestInit) {
    const token = process.env.MONOBANK_ACQUIRING_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException(
        'MONOBANK_ACQUIRING_TOKEN не налаштовано.',
      );
    }

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'X-Token': token,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as T | MonobankErrorResponse) : null;

    if (!response.ok) {
      const errorPayload = data as MonobankErrorResponse | null;
      const providerErrorText = errorPayload?.errText?.trim() ?? '';
      const normalizedErrorText = providerErrorText.toLowerCase();
      console.log(normalizedErrorText)
      if (normalizedErrorText.includes('h2h not allowed')) {
        throw new BadGatewayException(
          'Monobank H2H subscription API is not allowed for current acquiring token/merchant. Enable H2H subscription endpoints for this merchant and use a valid MONOBANK_ACQUIRING_TOKEN.',
        );
      }

      throw new BadGatewayException(
        providerErrorText ||
          'monobank повернув помилку під час обробки запиту.',
      );
    }

    return (data ?? undefined) as T;
  }
}

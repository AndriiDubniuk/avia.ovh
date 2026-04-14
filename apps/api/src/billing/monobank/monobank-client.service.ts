import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface MonobankCreateInvoiceArgs {
  amountMinor: number;
  currency: string;
  reference: string;
  redirectUrl: string;
  tokenizationRequested: boolean;
}

interface MonobankInvoiceResponse {
  invoiceId?: string;
  pageUrl?: string;
  finalDate?: string;
  [key: string]: unknown;
}

@Injectable()
export class MonobankClientService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async createInvoice(args: MonobankCreateInvoiceArgs) {
    const token = this.configService.get<string>('MONOBANK_TOKEN');
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
      throw new ServiceUnavailableException('Monobank returned invalid invoice data.');
    }

    const expiryRaw = response.data.finalDate;
    const expiresAt = expiryRaw ? new Date(expiryRaw) : new Date(Date.now() + 30 * 60 * 1000);

    return {
      providerInvoiceId: invoiceId,
      checkoutUrl: pageUrl,
      expiresAt,
      providerPayloadJson: response.data as Record<string, unknown>,
    };
  }
}

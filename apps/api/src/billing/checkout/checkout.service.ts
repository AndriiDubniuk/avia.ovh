import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  MonobankClientService,
  MonobankCreateInvoiceArgs,
} from '../monobank/monobank-client.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CheckoutStatus } from './enums/checkout-status.enum';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutSession)
    private readonly checkoutSessionsRepository: Repository<CheckoutSession>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly monobankClientService: MonobankClientService,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  async createCheckoutSession(
    subscriptionId: string,
    dto: CreateCheckoutSessionDto,
  ) {
    const subscription =
      await this.subscriptionsService.findByIdOrFail(subscriptionId);

    if (subscription.status !== SubscriptionStatus.PendingInitialPayment) {
      throw new UnprocessableEntityException(
        'Checkout can be created only for pending initial payment subscriptions.',
      );
    }

    const checkoutSessionId = randomUUID();
    const returnUrlWithCheckoutId = this.withCheckoutId(
      dto.return_url,
      checkoutSessionId,
    );

    const providerResult = await this.createProviderCheckout({
      checkoutSessionId,
      subscriptionId: subscription.id,
      amountMinor: subscription.amountMinor,
      currency: subscription.currency,
      redirectUrl: returnUrlWithCheckoutId,
      tokenizationRequested: dto.tokenization_requested,
    });

    const checkoutSession = this.checkoutSessionsRepository.create({
      id: checkoutSessionId,
      subscriptionId: subscription.id,
      clientId: subscription.clientId,
      providerInvoiceId: providerResult.providerInvoiceId,
      checkoutUrl: providerResult.checkoutUrl,
      status: CheckoutStatus.Created,
      tokenizationRequested: dto.tokenization_requested,
      returnUrl: returnUrlWithCheckoutId,
      providerPayloadJson: providerResult.providerPayloadJson,
      expiresAt: providerResult.expiresAt,
    });

    const savedSession =
      await this.checkoutSessionsRepository.save(checkoutSession);

    await this.paymentsService.createInitialPendingAttempt({
      subscriptionId: subscription.id,
      checkoutSessionId: savedSession.id,
      amountMinor: subscription.amountMinor,
      currency: subscription.currency,
      providerInvoiceId: savedSession.providerInvoiceId,
    });

    return {
      checkout_session_id: savedSession.id,
      provider: 'monobank',
      provider_invoice_id: savedSession.providerInvoiceId,
      checkout_url: savedSession.checkoutUrl,
      status: savedSession.status,
      expires_at: savedSession.expiresAt.toISOString(),
    };
  }

  private withCheckoutId(returnUrl: string, checkoutId: string) {
    try {
      const url = new URL(returnUrl);
      url.searchParams.set('checkoutId', checkoutId);
      return url.toString();
    } catch {
      return returnUrl;
    }
  }

  private async createProviderCheckout(args: {
    checkoutSessionId: string;
    subscriptionId: string;
    amountMinor: number;
    currency: string;
    redirectUrl: string;
    tokenizationRequested: boolean;
  }) {
    const mode = (this.configService.get<string>('MONOBANK_MODE') ?? 'mock')
      .trim()
      .toLowerCase();

    if (mode === 'mock') {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      return {
        providerInvoiceId: `mock-invoice-${args.checkoutSessionId}`,
        checkoutUrl: args.redirectUrl,
        expiresAt,
        providerPayloadJson: {
          mode: 'mock',
          checkout_session_id: args.checkoutSessionId,
          subscription_id: args.subscriptionId,
        } as Record<string, unknown>,
      };
    }

    const invoicePayload: MonobankCreateInvoiceArgs = {
      amountMinor: args.amountMinor,
      currency: args.currency,
      redirectUrl: args.redirectUrl,
      reference: args.subscriptionId,
      tokenizationRequested: args.tokenizationRequested,
    };

    return this.monobankClientService.createInvoice(invoicePayload);
  }
}

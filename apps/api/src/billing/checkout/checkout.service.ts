import {
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutStatus } from './enums/checkout-status.enum';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import {
  MonobankClientService,
  MonobankCreateInvoiceArgs,
} from '../monobank/monobank-client.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutSession)
    private readonly checkoutSessionsRepository: Repository<CheckoutSession>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly monobankClientService: MonobankClientService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createCheckoutSession(
    subscriptionId: string,
    dto: CreateCheckoutSessionDto,
  ) {
    const subscription = await this.subscriptionsService.findByIdOrFail(
      subscriptionId,
    );

    if (subscription.status !== SubscriptionStatus.PendingInitialPayment) {
      throw new UnprocessableEntityException(
        'Checkout can be created only for pending initial payment subscriptions.',
      );
    }

    const invoicePayload: MonobankCreateInvoiceArgs = {
      amountMinor: subscription.amountMinor,
      currency: subscription.currency,
      redirectUrl: dto.return_url,
      reference: subscription.id,
      tokenizationRequested: dto.tokenization_requested,
    };

    const providerResult = await this.monobankClientService.createInvoice(
      invoicePayload,
    );

    const checkoutSession = this.checkoutSessionsRepository.create({
      subscriptionId: subscription.id,
      clientId: subscription.clientId,
      providerInvoiceId: providerResult.providerInvoiceId,
      checkoutUrl: providerResult.checkoutUrl,
      status: CheckoutStatus.Created,
      tokenizationRequested: dto.tokenization_requested,
      returnUrl: dto.return_url,
      providerPayloadJson: providerResult.providerPayloadJson,
      expiresAt: providerResult.expiresAt,
    });

    const savedSession = await this.checkoutSessionsRepository.save(
      checkoutSession,
    );

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
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  findPublicBillingPlan,
  getPublicBillingPlans,
} from './billing.catalog';
import { CheckoutService } from './checkout/checkout.service';
import { CheckoutSession } from './checkout/entities/checkout-session.entity';
import { CheckoutStatus } from './checkout/enums/checkout-status.enum';
import { CreateBillingCheckoutDto } from './dto/create-billing-checkout.dto';
import { PaymentAttemptStatus } from './payments/enums/payment-attempt-status.enum';
import { PaymentAttemptType } from './payments/enums/payment-attempt-type.enum';
import { PaymentsService } from './payments/payments.service';
import { SubscriptionInterval } from './subscriptions/enums/subscription-interval.enum';
import { SubscriptionStatus } from './subscriptions/enums/subscription-status.enum';
import { SubscriptionsService } from './subscriptions/subscriptions.service';

export class PublicCheckoutStateDto {
  checkoutId: string;
  subscriptionId: string;
  planCode: string;
  planName: string;
  amount: number;
  ccy: number;
  interval: SubscriptionInterval;
  status: string;
  monobankStatus: string | null;
  nextChargeDate: string | null;
  startDate: string | null;
  endDate: string | null;
  cancellationDesc: string | null;
  totalPaid: number;
  totalFailed: number;
  canCancel: boolean;
}

function toCcy(currency: string) {
  return currency === 'UAH' ? 980 : 0;
}

@Injectable()
export class BillingService {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly checkoutService: CheckoutService,
    private readonly paymentsService: PaymentsService,
    @InjectRepository(CheckoutSession)
    private readonly checkoutRepository: Repository<CheckoutSession>,
  ) {}

  getPlans() {
    const plans = getPublicBillingPlans();

    return {
      plans: plans.map((plan) => ({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        amount: plan.amount_minor,
        ccy: toCcy(plan.currency),
        interval: plan.interval,
        intervalLabel: plan.intervalLabel,
        priceLabel: plan.priceLabel,
        badge: plan.badge,
        features: plan.features,
        note: plan.note,
      })),
    };
  }

  async createCheckout(dto: CreateBillingCheckoutDto) {
    const plan = findPublicBillingPlan(dto.planCode);

    if (!plan) {
      throw new NotFoundException('Billing plan not found.');
    }

    const timezone = dto.timezone?.trim() || 'Europe/Kyiv';
    const customerEmail = dto.customerEmail.trim().toLowerCase();
    const externalRef = `web:${customerEmail}`;

    const subscription = await this.subscriptionsService.createSubscription({
      client: {
        external_ref: externalRef,
        name: dto.customerName.trim(),
        email: customerEmail,
        phone: undefined,
      },
      plan: {
        amount_minor: plan.amount_minor,
        currency: plan.currency,
        interval: plan.interval,
      },
      timezone,
      start_mode: 'immediate',
    });

    const returnUrlBase = `${process.env.BILLING_PUBLIC_URL ?? 'http://localhost:3002'}/result`;

    const checkoutSession = await this.checkoutService.createCheckoutSession(
      subscription.subscription_id,
      {
        return_url: returnUrlBase,
        tokenization_requested: true,
      },
    );

    return {
      checkoutId: checkoutSession.checkout_session_id,
      subscriptionId: subscription.subscription_id,
      paymentUrl: checkoutSession.checkout_url,
    };
  }

  async getCheckout(checkoutId: string): Promise<PublicCheckoutStateDto> {
    const checkout = await this.checkoutRepository.findOne({
      where: { id: checkoutId },
    });

    if (!checkout) {
      throw new NotFoundException('Checkout not found.');
    }

    const subscription = await this.subscriptionsService.findByIdOrFail(
      checkout.subscriptionId,
    );
    const attempts = await this.paymentsService.listBySubscriptionId(
      checkout.subscriptionId,
    );

    const totalPaid = attempts.filter(
      (item) => item.status === PaymentAttemptStatus.Success,
    ).length;
    const totalFailed = attempts.filter(
      (item) => item.status === PaymentAttemptStatus.Failed,
    ).length;

    const initialSuccessAttempt = attempts.find(
      (item) =>
        item.type === PaymentAttemptType.Initial &&
        item.status === PaymentAttemptStatus.Success,
    );

    const status = this.resolvePublicStatus(
      subscription.status,
      checkout.status,
    );

    return {
      checkoutId: checkout.id,
      subscriptionId: subscription.id,
      planCode: this.resolvePlanCode(
        subscription.amountMinor,
        subscription.interval,
      ),
      planName: this.resolvePlanName(
        subscription.amountMinor,
        subscription.interval,
      ),
      amount: subscription.amountMinor,
      ccy: toCcy(subscription.currency),
      interval: subscription.interval,
      status,
      monobankStatus: checkout.status,
      nextChargeDate: subscription.nextChargeAt?.toISOString() ?? null,
      startDate: initialSuccessAttempt?.finalizedAt?.toISOString() ?? null,
      endDate: subscription.cancelledAt?.toISOString() ?? null,
      cancellationDesc:
        subscription.status === SubscriptionStatus.Cancelled
          ? 'Автопродовження скасовано.'
          : null,
      totalPaid,
      totalFailed,
      canCancel: this.canCancelSubscription(subscription.status),
    };
  }

  async cancelCheckout(checkoutId: string) {
    const checkout = await this.checkoutRepository.findOne({
      where: { id: checkoutId },
    });

    if (!checkout) {
      throw new NotFoundException('Checkout not found.');
    }

    await this.subscriptionsService.cancelSubscription(checkout.subscriptionId);
    return this.getCheckout(checkoutId);
  }

  private resolvePublicStatus(
    subscriptionStatus: SubscriptionStatus,
    checkoutStatus: CheckoutStatus,
  ) {
    if (subscriptionStatus !== SubscriptionStatus.PendingInitialPayment) {
      return subscriptionStatus;
    }

    if (checkoutStatus === CheckoutStatus.Expired) {
      return 'expired';
    }

    if (checkoutStatus === CheckoutStatus.Failed) {
      return SubscriptionStatus.FailedInitialPayment;
    }

    return 'awaiting_payment';
  }

  private canCancelSubscription(status: SubscriptionStatus) {
    return [
      SubscriptionStatus.PendingInitialPayment,
      SubscriptionStatus.Active,
      SubscriptionStatus.PastDue,
    ].includes(status);
  }

  private resolvePlanCode(amountMinor: number, interval: SubscriptionInterval) {
    const plans = getPublicBillingPlans();
    const match = plans.find(
      (plan) => plan.amount_minor === amountMinor && plan.interval === interval,
    );

    return match?.code ?? 'custom';
  }

  private resolvePlanName(amountMinor: number, interval: SubscriptionInterval) {
    const plans = getPublicBillingPlans();
    const match = plans.find(
      (plan) => plan.amount_minor === amountMinor && plan.interval === interval,
    );

    return match?.name ?? 'Subscription';
  }
}

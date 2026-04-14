import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingCheckout } from './entities/billing-checkout.entity';
import { BillingCheckoutEvent } from './entities/billing-checkout-event.entity';
import { CreateBillingCheckoutDto } from './dto/create-billing-checkout.dto';
import { findBillingPlan, getBillingPlans } from './billing.catalog';
import {
  findSubscriptionId,
  mapBillingCheckoutStatus,
  parseNullableDate,
  sanitizeMonobankPayload,
} from './billing.utils';
import { MonobankAcquiringService } from './monobank-acquiring.service';

type WebhookType = 'charge' | 'status';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingCheckout)
    private readonly checkoutRepository: Repository<BillingCheckout>,
    @InjectRepository(BillingCheckoutEvent)
    private readonly eventRepository: Repository<BillingCheckoutEvent>,
    private readonly monobankAcquiringService: MonobankAcquiringService,
  ) {}

  getPlans() {
    return {
      plans: getBillingPlans(),
    };
  }

  async createCheckout(dto: CreateBillingCheckoutDto) {
    const plan = findBillingPlan(dto.planCode);

    if (!plan) {
      throw new NotFoundException('Тариф не знайдено.');
    }

    const checkout = await this.checkoutRepository.save(
      this.checkoutRepository.create({
        planCode: plan.code,
        planName: plan.name,
        amount: plan.amount,
        ccy: plan.ccy,
        interval: plan.interval,
        status: 'created',
        monobankStatus: null,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail.trim().toLowerCase(),
        companyName: dto.companyName?.trim() || null,
      }),
    );

    const publicAppUrl =
      process.env.BILLING_PUBLIC_URL ?? 'http://localhost:3002';
    const publicApiUrl =
      process.env.BILLING_PUBLIC_API_URL ?? `${publicAppUrl}/api`;

    const monobankCheckout =
      await this.monobankAcquiringService.createSubscription({
        amount: plan.amount,
        ccy: plan.ccy,
        interval: plan.interval,
        redirectUrl: `${publicAppUrl}/result?checkoutId=${checkout.id}`,
        webHookUrls: {
          chargeUrl: `${publicApiUrl}/billing/monobank/webhooks/charge`,
          statusUrl: `${publicApiUrl}/billing/monobank/webhooks/status`,
        },
        validity: 24 * 60 * 60,
      });

    const updatedCheckout = await this.checkoutRepository.save({
      ...checkout,
      subscriptionId: monobankCheckout.subscriptionId,
      paymentPageUrl: monobankCheckout.pageUrl,
      status: 'awaiting_payment',
      monobankStatus: 'created',
    });

    return {
      checkoutId: updatedCheckout.id,
      paymentUrl: updatedCheckout.paymentPageUrl,
    };
  }

  async getCheckout(checkoutId: string, refresh = false) {
    const checkout = await this.checkoutRepository.findOne({
      where: { id: checkoutId },
    });

    if (!checkout) {
      throw new NotFoundException('Підписку не знайдено.');
    }

    const maybeUpdatedCheckout =
      refresh && this.shouldRefreshCheckout(checkout)
        ? await this.refreshCheckoutFromMonobank(checkout)
        : checkout;

    return this.toPublicCheckout(maybeUpdatedCheckout);
  }

  async cancelCheckout(checkoutId: string) {
    const checkout = await this.checkoutRepository.findOne({
      where: { id: checkoutId },
    });

    if (!checkout) {
      throw new NotFoundException('Підписку не знайдено.');
    }

    if (!checkout.subscriptionId) {
      throw new BadRequestException('Підписка ще не створена в monobank.');
    }

    if (checkout.monobankStatus === 'cancelled') {
      return this.toPublicCheckout(checkout);
    }

    if (checkout.monobankStatus === 'created') {
      await this.monobankAcquiringService.removeSubscription(
        checkout.subscriptionId,
      );
      const updatedCheckout = await this.checkoutRepository.save({
        ...checkout,
        status: 'cancelled',
        monobankStatus: 'cancelled',
        endDate: new Date(),
        cancellationDesc:
          checkout.cancellationDesc ?? 'Скасовано до першого списання.',
        lastSyncedAt: new Date(),
      });

      return this.toPublicCheckout(updatedCheckout);
    }

    await this.monobankAcquiringService.cancelSubscription(
      checkout.subscriptionId,
    );

    const updatedCheckout = await this.refreshCheckoutFromMonobank(checkout);

    return this.toPublicCheckout(updatedCheckout);
  }

  async handleWebhook(type: WebhookType, rawBody: Buffer, xSign: string) {
    const isValidSignature =
      await this.monobankAcquiringService.verifyWebhookSignature(
        rawBody,
        xSign,
      );

    if (!isValidSignature) {
      throw new UnauthorizedException('Невалідний підпис вебхука monobank.');
    }

    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(rawBody.toString('utf-8')) as Record<
        string,
        unknown
      >;
    } catch {
      throw new BadRequestException(
        'Webhook monobank містить невалідний JSON.',
      );
    }
    const subscriptionId = findSubscriptionId(payload);
    const checkout = subscriptionId
      ? await this.checkoutRepository.findOne({
          where: { subscriptionId },
        })
      : null;

    await this.eventRepository.save(
      this.eventRepository.create({
        eventType: type,
        checkoutId: checkout?.id ?? null,
        subscriptionId,
        signatureValid: true,
        payload: sanitizeMonobankPayload(payload) as Record<string, unknown>,
      }),
    );

    if (!checkout) {
      return;
    }

    const withWebhookFields = await this.checkoutRepository.save({
      ...checkout,
      lastWebhookAt: new Date(),
      latestChargeStatus:
        type === 'charge' && typeof payload.status === 'string'
          ? payload.status
          : checkout.latestChargeStatus,
      latestChargeDate:
        type === 'charge' && typeof payload.chargedAt === 'string'
          ? parseNullableDate(payload.chargedAt)
          : checkout.latestChargeDate,
    });

    await this.refreshCheckoutFromMonobank(withWebhookFields);
  }

  private shouldRefreshCheckout(checkout: BillingCheckout) {
    return Boolean(
      checkout.subscriptionId &&
      ['created', 'awaiting_payment', 'pending'].includes(checkout.status),
    );
  }

  private async refreshCheckoutFromMonobank(checkout: BillingCheckout) {
    if (!checkout.subscriptionId) {
      return checkout;
    }

    const status = await this.monobankAcquiringService.getSubscriptionStatus(
      checkout.subscriptionId,
    );

    return this.checkoutRepository.save({
      ...checkout,
      amount: status.amount,
      ccy: status.ccy,
      interval: status.interval,
      monobankStatus: status.status,
      status: mapBillingCheckoutStatus(status.status),
      startDate: parseNullableDate(status.startDate),
      endDate: parseNullableDate(status.endDate),
      nextChargeDate: parseNullableDate(status.nextChargeDate),
      cancellationDesc: status.cancellationDesc ?? null,
      totalPaid: status.summary?.totalPaid ?? checkout.totalPaid,
      totalFailed: status.summary?.totalFailed ?? checkout.totalFailed,
      walletStatus: status.walletData?.status ?? checkout.walletStatus,
      latestPayload: sanitizeMonobankPayload(status) as Record<string, unknown>,
      lastSyncedAt: new Date(),
    });
  }

  private toPublicCheckout(checkout: BillingCheckout) {
    return {
      checkoutId: checkout.id,
      subscriptionId: checkout.subscriptionId,
      planCode: checkout.planCode,
      planName: checkout.planName,
      amount: checkout.amount,
      ccy: checkout.ccy,
      interval: checkout.interval,
      status: checkout.status,
      monobankStatus: checkout.monobankStatus,
      nextChargeDate: checkout.nextChargeDate,
      startDate: checkout.startDate,
      endDate: checkout.endDate,
      cancellationDesc: checkout.cancellationDesc,
      latestChargeStatus: checkout.latestChargeStatus,
      totalPaid: checkout.totalPaid,
      totalFailed: checkout.totalFailed,
      canCancel: Boolean(
        checkout.subscriptionId &&
        !['cancelled', 'expired', 'failed'].includes(checkout.status),
      ),
      paymentPageUrl: checkout.paymentPageUrl,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
    };
  }
}

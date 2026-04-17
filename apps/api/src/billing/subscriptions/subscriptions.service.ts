import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BILLING_CURRENCY } from '../billing.constants';
import { ClientsService } from '../clients/clients.service';
import { MonobankAcquiringService } from '../monobank-acquiring.service';
import { PaymentAttempt } from '../payments/entities/payment-attempt.entity';
import { PaymentAttemptStatus } from '../payments/enums/payment-attempt-status.enum';
import { PaymentAttemptType } from '../payments/enums/payment-attempt-type.enum';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import {
  assertCanCancelSubscription,
  isAlreadyCancelled,
} from './subscription-transitions';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(PaymentAttempt)
    private readonly paymentAttemptsRepository: Repository<PaymentAttempt>,
    private readonly clientsService: ClientsService,
    private readonly monobankAcquiringService: MonobankAcquiringService,
  ) {}

  async createSubscription(
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const timezone = dto.timezone?.trim() || 'Europe/Kyiv';
    const client = await this.clientsService.upsertByExternalRef({
      externalRef: dto.client.external_ref,
      name: dto.client.name,
      email: dto.client.email,
      phone: dto.client.phone,
      timezone,
    });

    const now = new Date();
    const subscription = this.subscriptionsRepository.create({
      clientId: client.id,
      paymentMethodId: null,
      providerSubscriptionId: null,
      status: SubscriptionStatus.PendingInitialPayment,
      amountMinor: dto.plan.amount_minor,
      currency: BILLING_CURRENCY,
      interval: dto.plan.interval,
      anchorDay: now.getUTCDate(),
      clientTimezone: timezone,
      nextChargeAt: null,
      periodEndAt: null,
      cancelRequestedAt: null,
      cancelledAt: null,
      retryCount: 0,
      maxRetries: 3,
      lastFailureAt: null,
    });

    const saved = await this.subscriptionsRepository.save(subscription);

    return this.toResponse(saved);
  }

  async getSubscription(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    return this.toResponse(subscription);
  }

  async findByIdOrFail(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    return subscription;
  }

  async cancelSubscription(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.findByIdOrFail(id);

    if (isAlreadyCancelled(subscription.status)) {
      return this.toResponse(subscription);
    }

    assertCanCancelSubscription(subscription.status);

    const now = new Date();

    if (subscription.providerSubscriptionId) {
      try {
        await this.monobankAcquiringService.cancelSubscription(
          subscription.providerSubscriptionId,
        );
      } catch {
        // Local cancel remains source of truth; provider cancel errors are non-fatal.
      }
    }

    await this.subscriptionsRepository.update(
      { id: subscription.id },
      {
        status: SubscriptionStatus.Cancelled,
        cancelRequestedAt: subscription.cancelRequestedAt ?? now,
        cancelledAt: now,
        nextChargeAt: null,
      },
    );

    await this.paymentAttemptsRepository
      .createQueryBuilder()
      .update(PaymentAttempt)
      .set({
        status: PaymentAttemptStatus.Failed,
        failureCode: 'cancelled',
        failureMessage: 'Subscription cancelled before charge execution.',
        finalizedAt: now,
      })
      .where('subscription_id = :subscriptionId', {
        subscriptionId: subscription.id,
      })
      .andWhere('type = :type', { type: PaymentAttemptType.Recurring })
      .andWhere('status = :status', { status: PaymentAttemptStatus.Pending })
      .execute();

    const updated = await this.findByIdOrFail(id);
    return this.toResponse(updated);
  }

  private toResponse(subscription: Subscription): SubscriptionResponseDto {
    return {
      subscription_id: subscription.id,
      status: subscription.status,
      client_id: subscription.clientId,
      payment_method_id: subscription.paymentMethodId,
      amount_minor: subscription.amountMinor,
      currency: subscription.currency,
      interval: subscription.interval,
      next_charge_at: subscription.nextChargeAt?.toISOString() ?? null,
      cancelled_at: subscription.cancelledAt?.toISOString() ?? null,
      created_at: subscription.createdAt.toISOString(),
    };
  }
}

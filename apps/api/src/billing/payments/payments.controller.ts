import { Controller, Get, Param } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentsService } from './payments.service';

@Controller('billing/subscriptions')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get(':id/payment-attempts')
  async listBySubscription(@Param('id') subscriptionId: string) {
    await this.subscriptionsService.findByIdOrFail(subscriptionId);
    const attempts = await this.paymentsService.listBySubscriptionId(subscriptionId);

    return {
      items: attempts.map((attempt) => ({
        payment_attempt_id: attempt.id,
        type: attempt.type,
        status: attempt.status,
        amount_minor: attempt.amountMinor,
        currency: attempt.currency,
        billing_period_key: attempt.billingPeriodKey,
        created_at: attempt.createdAt.toISOString(),
        finalized_at: attempt.finalizedAt?.toISOString() ?? null,
      })),
    };
  }
}

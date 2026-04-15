import { Controller, HttpCode, Param, Post, Query } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('internal/billing/webhooks')
export class InternalWebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('replay/:eventId')
  @HttpCode(200)
  async replay(@Param('eventId') eventId: string) {
    return this.webhooksService.replayFailedEvent(eventId);
  }

  @Post('mock/subscriptions/:subscriptionId/success')
  @HttpCode(200)
  async mockSuccess(@Param('subscriptionId') subscriptionId: string) {
    return this.webhooksService.triggerMockInitialPaymentWebhook(
      subscriptionId,
      'success',
    );
  }

  @Post('mock/subscriptions/:subscriptionId/failure-expiry')
  @HttpCode(200)
  async mockFailureOrExpiry(
    @Param('subscriptionId') subscriptionId: string,
    @Query('status') status?: string,
  ) {
    const mode = status === 'failure' ? 'failure' : 'expired';

    return this.webhooksService.triggerMockInitialPaymentWebhook(
      subscriptionId,
      mode,
    );
  }
}

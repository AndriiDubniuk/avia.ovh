import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from './entities/webhook-event.entity';
import { InternalWebhooksController } from './internal-webhooks.controller';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookEventsService } from './webhook-events.service';
import { MonobankModule } from '../monobank/monobank.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { BillingEmailsModule } from '../emails/billing-emails.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent]),
    MonobankModule,
    PaymentMethodsModule,
    BillingEmailsModule,
  ],
  controllers: [WebhooksController, InternalWebhooksController],
  providers: [WebhooksService, WebhookEventsService],
  exports: [WebhooksService],
})
export class WebhooksModule {}

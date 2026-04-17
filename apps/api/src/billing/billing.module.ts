import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CheckoutModule } from './checkout/checkout.module';
import { CheckoutSession } from './checkout/entities/checkout-session.entity';
import { ClientsModule } from './clients/clients.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { MonobankModule } from './monobank/monobank.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { PaymentsModule } from './payments/payments.module';
import { PersonalBillingLink } from './personal-links/entities/personal-billing-link.entity';
import {
  InternalPersonalBillingLinksController,
  PersonalBillingLinksController,
} from './personal-links/personal-billing-links.controller';
import { PersonalBillingLinksService } from './personal-links/personal-billing-links.service';
import { PortalModule } from './portal/portal.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutSession, PersonalBillingLink]),
    ClientsModule,
    SubscriptionsModule,
    CheckoutModule,
    PaymentsModule,
    PortalModule,
    IdempotencyModule,
    MonobankModule,
    PaymentMethodsModule,
    WebhooksModule,
  ],
  controllers: [
    BillingController,
    PersonalBillingLinksController,
    InternalPersonalBillingLinksController,
  ],
  providers: [BillingService, PersonalBillingLinksService],
})
export class BillingModule {}

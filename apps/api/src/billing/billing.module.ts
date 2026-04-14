import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CheckoutModule } from './checkout/checkout.module';
import { PaymentsModule } from './payments/payments.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { MonobankModule } from './monobank/monobank.module';

@Module({
  imports: [
    ClientsModule,
    SubscriptionsModule,
    CheckoutModule,
    PaymentsModule,
    IdempotencyModule,
    MonobankModule,
  ],
})
export class BillingModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '../clients/clients.module';
import { CheckoutSession } from '../checkout/entities/checkout-session.entity';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { MonobankModule } from '../monobank/monobank.module';
import { PaymentAttempt } from '../payments/entities/payment-attempt.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, PaymentAttempt, CheckoutSession]),
    ClientsModule,
    IdempotencyModule,
    MonobankModule,
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

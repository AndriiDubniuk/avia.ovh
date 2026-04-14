import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MonobankModule } from '../monobank/monobank.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutSession]),
    SubscriptionsModule,
    MonobankModule,
    PaymentsModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}

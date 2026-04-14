import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingCheckout } from './entities/billing-checkout.entity';
import { BillingCheckoutEvent } from './entities/billing-checkout-event.entity';
import { MonobankAcquiringService } from './monobank-acquiring.service';

@Module({
  imports: [TypeOrmModule.forFeature([BillingCheckout, BillingCheckoutEvent])],
  controllers: [BillingController],
  providers: [BillingService, MonobankAcquiringService],
})
export class BillingModule {}

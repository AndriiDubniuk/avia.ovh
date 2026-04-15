import { Module } from '@nestjs/common';
import { RecurringBillingController } from './recurring-billing.controller';
import { RecurringBillingService } from './recurring-billing.service';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { MonobankModule } from '../monobank/monobank.module';

@Module({
  imports: [PaymentsModule, PaymentMethodsModule, MonobankModule],
  controllers: [RecurringBillingController],
  providers: [RecurringBillingService],
  exports: [RecurringBillingService],
})
export class RecurringBillingModule {}

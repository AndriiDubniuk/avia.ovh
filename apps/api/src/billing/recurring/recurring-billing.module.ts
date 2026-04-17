import { Module } from '@nestjs/common';
import { RecurringBillingController } from './recurring-billing.controller';
import { RecurringBillingRunnerService } from './recurring-billing-runner.service';
import { RecurringBillingService } from './recurring-billing.service';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { MonobankModule } from '../monobank/monobank.module';
import { BillingEmailsModule } from '../emails/billing-emails.module';

@Module({
  imports: [
    PaymentsModule,
    PaymentMethodsModule,
    MonobankModule,
    BillingEmailsModule,
  ],
  controllers: [RecurringBillingController],
  providers: [RecurringBillingService, RecurringBillingRunnerService],
  exports: [RecurringBillingService],
})
export class RecurringBillingModule {}

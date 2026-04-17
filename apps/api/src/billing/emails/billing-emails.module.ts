import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingEmailService } from './billing-email.service';
import { BillingEmailEvent } from './entities/billing-email-event.entity';
import { ResendEmailService } from './resend-email.service';

@Module({
  imports: [TypeOrmModule.forFeature([BillingEmailEvent])],
  providers: [ResendEmailService, BillingEmailService],
  exports: [BillingEmailService],
})
export class BillingEmailsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { BillingEmailsModule } from '../emails/billing-emails.module';
import { PaymentsModule } from '../payments/payments.module';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PortalAccessToken } from './entities/portal-access-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PortalAccessToken, Client, Subscription]),
    BillingEmailsModule,
    PaymentsModule,
    SubscriptionsModule,
  ],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}

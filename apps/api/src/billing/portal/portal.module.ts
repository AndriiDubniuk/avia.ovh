import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PortalAccessToken } from './entities/portal-access-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PortalAccessToken, Client, Subscription]),
    SubscriptionsModule,
  ],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}

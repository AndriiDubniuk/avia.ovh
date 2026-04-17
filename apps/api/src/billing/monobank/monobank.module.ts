import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MonobankClientService } from './monobank-client.service';
import { MonobankAcquiringService } from '../monobank-acquiring.service';

@Module({
  imports: [HttpModule],
  providers: [MonobankClientService, MonobankAcquiringService],
  exports: [MonobankClientService, MonobankAcquiringService],
})
export class MonobankModule {}

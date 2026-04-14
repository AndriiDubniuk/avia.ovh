import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MonobankClientService } from './monobank-client.service';

@Module({
  imports: [HttpModule],
  providers: [MonobankClientService],
  exports: [MonobankClientService],
})
export class MonobankModule {}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { UseIdempotency } from '../idempotency/idempotency.decorator';
import { assertPublicBillingFlowAllowed } from '../billing-private-mode.util';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('billing/subscriptions')
@UseInterceptors(IdempotencyInterceptor)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseIdempotency()
  async create(@Body() dto: CreateSubscriptionDto) {
    assertPublicBillingFlowAllowed(this.configService);
    return this.subscriptionsService.createSubscription(dto);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.subscriptionsService.getSubscription(id);
  }

  @Post(':id/cancel')
  @UseIdempotency()
  async cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(id);
  }
}

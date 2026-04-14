import { Body, Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { UseIdempotency } from '../idempotency/idempotency.decorator';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('billing/subscriptions')
@UseInterceptors(IdempotencyInterceptor)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseIdempotency()
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.subscriptionsService.getSubscription(id);
  }
}

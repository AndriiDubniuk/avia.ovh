import { Body, Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutService } from './checkout.service';
import { UseIdempotency } from '../idempotency/idempotency.decorator';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';

@Controller('billing/subscriptions')
@UseInterceptors(IdempotencyInterceptor)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':id/checkout-session')
  @UseIdempotency()
  async createCheckoutSession(
    @Param('id') subscriptionId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.checkoutService.createCheckoutSession(subscriptionId, dto);
  }
}

import { Body, Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutService } from './checkout.service';
import { UseIdempotency } from '../idempotency/idempotency.decorator';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { assertPublicBillingFlowAllowed } from '../billing-private-mode.util';

@Controller('billing/subscriptions')
@UseInterceptors(IdempotencyInterceptor)
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly configService: ConfigService,
  ) {}

  @Post(':id/checkout-session')
  @UseIdempotency()
  async createCheckoutSession(
    @Param('id') subscriptionId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    assertPublicBillingFlowAllowed(this.configService);
    return this.checkoutService.createCheckoutSession(subscriptionId, dto);
  }
}

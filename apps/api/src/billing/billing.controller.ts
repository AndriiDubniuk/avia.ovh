import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateBillingCheckoutDto } from './dto/create-billing-checkout.dto';
import { assertPublicBillingFlowAllowed } from './billing-private-mode.util';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Post('checkouts')
  createCheckout(@Body() dto: CreateBillingCheckoutDto) {
    assertPublicBillingFlowAllowed(this.configService);
    return this.billingService.createCheckout(dto);
  }

  @Get('checkouts/:checkoutId')
  getCheckout(@Param('checkoutId') checkoutId: string) {
    return this.billingService.getCheckout(checkoutId);
  }

  @Post('checkouts/:checkoutId/cancel')
  cancelCheckout(@Param('checkoutId') checkoutId: string) {
    return this.billingService.cancelCheckout(checkoutId);
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseBoolPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { CreateBillingCheckoutDto } from './dto/create-billing-checkout.dto';

type RequestWithRawBody = Request & { rawBody?: Buffer };

function getRawBody(request: RequestWithRawBody) {
  if (request.rawBody) {
    return request.rawBody;
  }

  if (Buffer.isBuffer(request.body)) {
    return request.body;
  }

  throw new Error('Raw body is missing.');
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Post('checkouts')
  createCheckout(@Body() dto: CreateBillingCheckoutDto) {
    return this.billingService.createCheckout(dto);
  }

  @Get('checkouts/:checkoutId')
  getCheckout(
    @Param('checkoutId') checkoutId: string,
    @Query('refresh', new ParseBoolPipe({ optional: true })) refresh?: boolean,
  ) {
    return this.billingService.getCheckout(checkoutId, refresh);
  }

  @Post('checkouts/:checkoutId/cancel')
  cancelCheckout(@Param('checkoutId') checkoutId: string) {
    return this.billingService.cancelCheckout(checkoutId);
  }

  @Post('monobank/webhooks/status')
  @HttpCode(200)
  async handleStatusWebhook(
    @Req() request: RequestWithRawBody,
    @Headers('x-sign') xSign = '',
  ) {
    await this.billingService.handleWebhook(
      'status',
      getRawBody(request),
      xSign,
    );

    return { status: 'ok' };
  }

  @Post('monobank/webhooks/charge')
  @HttpCode(200)
  async handleChargeWebhook(
    @Req() request: RequestWithRawBody,
    @Headers('x-sign') xSign = '',
  ) {
    await this.billingService.handleWebhook(
      'charge',
      getRawBody(request),
      xSign,
    );

    return { status: 'ok' };
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PortalRequestLinkDto } from './dto/portal-request-link.dto';
import { PortalService } from './portal.service';

@Controller('billing/portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('request-link')
  async requestLink(@Body() dto: PortalRequestLinkDto) {
    return this.portalService.requestLink(dto.email);
  }

  @Get('verify')
  async verify(
    @Query('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.portalService.verifyMagicLink(token, response);
  }

  @Get('subscriptions')
  async listSubscriptions(@Req() request: Request) {
    return this.portalService.listSubscriptions(request);
  }

  @Get('subscriptions/:id')
  async getSubscription(@Req() request: Request, @Param('id') id: string) {
    return this.portalService.getSubscription(request, id);
  }

  @Post('subscriptions/:id/cancel')
  async cancelSubscription(@Req() request: Request, @Param('id') id: string) {
    return this.portalService.cancelSubscription(request, id);
  }
}

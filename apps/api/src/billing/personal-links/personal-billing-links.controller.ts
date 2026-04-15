import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePersonalBillingLinkDto } from './dto/create-personal-billing-link.dto';
import { PersonalBillingLinksService } from './personal-billing-links.service';

@Controller('billing/personal-links')
export class PersonalBillingLinksController {
  constructor(
    private readonly personalBillingLinksService: PersonalBillingLinksService,
  ) {}

  @Get(':token')
  async getOffer(@Param('token') token: string) {
    return this.personalBillingLinksService.getOfferByToken(token);
  }

  @Post(':token/checkout')
  async createCheckout(@Param('token') token: string) {
    return this.personalBillingLinksService.createCheckoutByToken(token);
  }
}

@Controller('internal/billing/personal-links')
export class InternalPersonalBillingLinksController {
  constructor(
    private readonly personalBillingLinksService: PersonalBillingLinksService,
  ) {}

  @Post()
  async createPersonalLink(@Body() dto: CreatePersonalBillingLinkDto) {
    return this.personalBillingLinksService.createLink(dto);
  }
}

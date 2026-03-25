import { Body, Controller, Post } from '@nestjs/common';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ContactRequestsService } from './contact-requests.service';

@Controller('contact-requests')
export class ContactRequestsController {
  constructor(
    private readonly contactRequestsService: ContactRequestsService,
  ) {}

  @Post()
  create(@Body() dto: CreateContactRequestDto) {
    return this.contactRequestsService.create(dto);
  }
}

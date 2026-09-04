import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactRequest } from './contact-request.entity';
import { ContactRequestsController } from './contact-requests.controller';
import { ContactRequestsService } from './contact-requests.service';
import { ContactMailService } from './mail/contact-mail.service';
import { ContactTelegramService } from './telegram/contact-telegram.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactRequest])],
  controllers: [ContactRequestsController],
  providers: [
    ContactRequestsService,
    ContactMailService,
    ContactTelegramService,
  ],
})
export class ContactRequestsModule {}

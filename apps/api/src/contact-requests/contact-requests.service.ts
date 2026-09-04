import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ContactRequest } from './contact-request.entity';
import { ContactMailService } from './mail/contact-mail.service';
import { ContactTelegramService } from './telegram/contact-telegram.service';

/** Канал сповіщення: пошта, Telegram — і будь-який наступний. */
type NotificationChannel = {
  isConfigured(): boolean;
  sendContactRequest(request: ContactRequest): Promise<void>;
};

@Injectable()
export class ContactRequestsService {
  private readonly logger = new Logger(ContactRequestsService.name);

  constructor(
    @InjectRepository(ContactRequest)
    private readonly contactRequestsRepository: Repository<ContactRequest>,
    private readonly contactMailService: ContactMailService,
    private readonly contactTelegramService: ContactTelegramService,
  ) {}

  async create(dto: CreateContactRequestDto) {
    const entity = this.contactRequestsRepository.create({
      ...dto,
      companyName: dto.companyName?.trim() || null,
    });

    const savedRequest = await this.contactRequestsRepository.save(entity);

    /* Сповіщення не є частиною збереження. Заявка вже в базі, тож падіння
       пошти або Telegram не має ані втрачати її, ані заважати іншому каналу:
       обидва йдуть паралельно й кожен обробляє свою помилку сам. */
    await Promise.all([
      this.notify('пошта', this.contactMailService, savedRequest),
      this.notify('Telegram', this.contactTelegramService, savedRequest),
    ]);

    return {
      id: savedRequest.id,
      createdAt: savedRequest.createdAt,
      message: 'Заявку успішно збережено.',
    };
  }

  private async notify(
    name: string,
    channel: NotificationChannel,
    request: ContactRequest,
  ) {
    if (!channel.isConfigured()) {
      this.logger.warn(
        `Канал «${name}» не налаштований — заявку ${request.id} туди не надіслано.`,
      );
      return;
    }

    try {
      await channel.sendContactRequest(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed.';
      this.logger.error(
        `Заявку ${request.id} збережено, але канал «${name}» не спрацював: ${message}`,
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ContactRequest } from './contact-request.entity';

@Injectable()
export class ContactRequestsService {
  constructor(
    @InjectRepository(ContactRequest)
    private readonly contactRequestsRepository: Repository<ContactRequest>,
  ) {}

  async create(dto: CreateContactRequestDto) {
    const entity = this.contactRequestsRepository.create({
      ...dto,
      companyName: dto.companyName?.trim() || null,
    });

    const savedRequest = await this.contactRequestsRepository.save(entity);

    return {
      id: savedRequest.id,
      createdAt: savedRequest.createdAt,
      message: 'Заявку успішно збережено.',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

export interface UpsertClientInput {
  externalRef: string;
  name: string;
  email: string;
  phone?: string;
  timezone: string;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  async upsertByExternalRef(input: UpsertClientInput): Promise<Client> {
    const existing = await this.clientsRepository.findOne({
      where: { externalRef: input.externalRef },
    });

    if (existing) {
      existing.name = input.name;
      existing.email = input.email;
      existing.phone = input.phone?.trim() || null;
      existing.timezone = input.timezone;
      return this.clientsRepository.save(existing);
    }

    const created = this.clientsRepository.create({
      externalRef: input.externalRef,
      name: input.name,
      email: input.email,
      phone: input.phone?.trim() || null,
      timezone: input.timezone,
    });

    return this.clientsRepository.save(created);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { IdempotencyRecord } from './idempotency.entity';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyRecord)
    private readonly idempotencyRepository: Repository<IdempotencyRecord>,
  ) {}

  async findByKeyAndRoute(idempotencyKey: string, route: string) {
    return this.idempotencyRepository.findOne({
      where: { idempotencyKey, route },
    });
  }

  async saveRecord(input: {
    idempotencyKey: string;
    route: string;
    requestHash: string;
    responseStatus: number;
    responseJson: Record<string, unknown>;
  }) {
    const existing = await this.findByKeyAndRoute(
      input.idempotencyKey,
      input.route,
    );

    if (existing) {
      return existing;
    }

    return this.idempotencyRepository.save(
      this.idempotencyRepository.create(input),
    );
  }

  async cleanupExpired(ttlHours: number) {
    const threshold = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
    await this.idempotencyRepository.delete({
      createdAt: LessThan(threshold),
    });
  }
}

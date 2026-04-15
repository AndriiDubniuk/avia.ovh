import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { WebhookEvent } from './entities/webhook-event.entity';
import { WebhookProcessingStatus } from './enums/webhook-processing-status.enum';

@Injectable()
export class WebhookEventsService {
  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventsRepository: Repository<WebhookEvent>,
  ) {}

  async createPendingEvent(input: {
    provider: string;
    eventKey: string;
    eventType: string;
    payloadJson: Record<string, unknown>;
    signatureValid: boolean;
  }): Promise<{ duplicate: boolean; event: WebhookEvent | null }> {
    const entity = this.webhookEventsRepository.create({
      provider: input.provider,
      eventKey: input.eventKey,
      eventType: input.eventType,
      payloadJson: input.payloadJson,
      signatureValid: input.signatureValid,
      processedAt: null,
      errorMessage: null,
      processingStatus: WebhookProcessingStatus.Pending,
    });

    try {
      const saved = await this.webhookEventsRepository.save(entity);
      return { duplicate: false, event: saved };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        typeof (error as QueryFailedError & { code?: string }).code ===
          'string' &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        return { duplicate: true, event: null };
      }

      throw error;
    }
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.webhookEventsRepository.update(
      { id: eventId },
      {
        processingStatus: WebhookProcessingStatus.Processed,
        processedAt: new Date(),
        errorMessage: null,
      },
    );
  }

  async markFailed(eventId: string, errorMessage: string): Promise<void> {
    await this.webhookEventsRepository.update(
      { id: eventId },
      {
        processingStatus: WebhookProcessingStatus.Failed,
        processedAt: new Date(),
        errorMessage,
      },
    );
  }

  async getFailedEventOrThrow(eventId: string): Promise<WebhookEvent> {
    const event = await this.webhookEventsRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Webhook event not found.');
    }

    if (event.processingStatus !== WebhookProcessingStatus.Failed) {
      throw new UnprocessableEntityException(
        'Only failed webhook events can be replayed.',
      );
    }

    return event;
  }
}

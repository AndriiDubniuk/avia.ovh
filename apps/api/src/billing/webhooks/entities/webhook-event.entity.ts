import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WebhookProcessingStatus } from '../enums/webhook-processing-status.enum';

@Entity({ name: 'webhook_events' })
@Index(['provider', 'eventKey'], { unique: true })
@Index(['processingStatus', 'receivedAt'])
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  provider: string;

  @Column({ name: 'event_key', type: 'varchar', length: 160 })
  eventKey: string;

  @Column({ name: 'event_type', type: 'varchar', length: 80 })
  eventType: string;

  @Column({ name: 'signature_valid', type: 'boolean', default: false })
  signatureValid: boolean;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson: Record<string, unknown>;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: WebhookProcessingStatus,
  })
  processingStatus: WebhookProcessingStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;
}

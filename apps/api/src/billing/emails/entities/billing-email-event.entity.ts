import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'billing_email_events' })
@Index(['eventKey', 'recipientEmail'], { unique: true })
export class BillingEmailEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_key', type: 'varchar', length: 180 })
  eventKey: string;

  @Column({ name: 'recipient_email', type: 'varchar', length: 320 })
  recipientEmail: string;

  @Column({ type: 'varchar', length: 120 })
  kind: string;

  @Column({ type: 'varchar', length: 24, default: 'pending' })
  status: 'pending' | 'sent' | 'failed';

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

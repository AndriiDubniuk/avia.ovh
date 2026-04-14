import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'billing_checkout_events' })
export class BillingCheckoutEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 24 })
  eventType: string;

  @Column({ type: 'uuid', nullable: true })
  checkoutId: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  subscriptionId: string | null;

  @Column({ default: false })
  signatureValid: boolean;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  receivedAt: Date;
}

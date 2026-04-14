import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CheckoutStatus } from '../enums/checkout-status.enum';

@Entity({ name: 'checkout_sessions' })
@Index(['providerInvoiceId'], { unique: true })
@Index(['subscriptionId', 'status'])
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'provider_invoice_id', type: 'varchar', length: 128 })
  providerInvoiceId: string;

  @Column({ name: 'checkout_url', type: 'text' })
  checkoutUrl: string;

  @Column({ type: 'enum', enum: CheckoutStatus })
  status: CheckoutStatus;

  @Column({ name: 'tokenization_requested', type: 'boolean', default: true })
  tokenizationRequested: boolean;

  @Column({ name: 'return_url', type: 'text' })
  returnUrl: string;

  @Column({
    name: 'provider_payload_json',
    type: 'jsonb',
    nullable: true,
  })
  providerPayloadJson: Record<string, unknown> | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentAttemptStatus } from '../enums/payment-attempt-status.enum';
import { PaymentAttemptType } from '../enums/payment-attempt-type.enum';

@Entity({ name: 'payment_attempts' })
@Index(['idempotencyKey'], { unique: true })
@Index(['subscriptionId', 'createdAt'])
@Index(['status', 'scheduledFor'])
@Index(['subscriptionId', 'billingPeriodKey', 'retryNo'], { unique: true })
export class PaymentAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'payment_method_id', type: 'uuid', nullable: true })
  paymentMethodId: string | null;

  @Column({ name: 'checkout_session_id', type: 'uuid', nullable: true })
  checkoutSessionId: string | null;

  @Column({ type: 'enum', enum: PaymentAttemptType })
  type: PaymentAttemptType;

  @Column({ type: 'enum', enum: PaymentAttemptStatus })
  status: PaymentAttemptStatus;

  @Column({ name: 'amount_minor', type: 'int' })
  amountMinor: number;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ name: 'billing_period_key', type: 'varchar', length: 80 })
  billingPeriodKey: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 128 })
  idempotencyKey: string;

  @Column({
    name: 'provider_payment_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  providerPaymentId: string | null;

  @Column({
    name: 'provider_invoice_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  providerInvoiceId: string | null;

  @Column({ name: 'failure_code', type: 'varchar', length: 64, nullable: true })
  failureCode: string | null;

  @Column({ name: 'failure_message', type: 'text', nullable: true })
  failureMessage: string | null;

  @Column({ name: 'retry_no', type: 'smallint', default: 0 })
  retryNo: number;

  @Column({ name: 'scheduled_for', type: 'timestamptz', nullable: true })
  scheduledFor: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'finalized_at', type: 'timestamptz', nullable: true })
  finalizedAt: Date | null;
}

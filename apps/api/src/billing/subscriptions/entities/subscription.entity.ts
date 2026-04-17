import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionInterval } from '../enums/subscription-interval.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

@Entity({ name: 'subscriptions' })
@Index(['status', 'nextChargeAt'])
@Index(['clientId', 'status'])
@Index(['providerSubscriptionId'], { unique: true })
@Check('CHK_subscriptions_amount_minor', 'amount_minor >= 100')
@Check('CHK_subscriptions_currency', "currency = 'UAH'")
@Check('CHK_subscriptions_anchor_day', 'anchor_day >= 1 AND anchor_day <= 31')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'payment_method_id', type: 'uuid', nullable: true })
  paymentMethodId: string | null;

  @Column({
    name: 'provider_subscription_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  providerSubscriptionId: string | null;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Column({ name: 'amount_minor', type: 'int' })
  amountMinor: number;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ type: 'enum', enum: SubscriptionInterval })
  interval: SubscriptionInterval;

  @Column({ name: 'anchor_day', type: 'smallint' })
  anchorDay: number;

  @Column({ name: 'client_timezone', type: 'varchar', length: 64 })
  clientTimezone: string;

  @Column({ name: 'next_charge_at', type: 'timestamptz', nullable: true })
  nextChargeAt: Date | null;

  @Column({ name: 'period_end_at', type: 'timestamptz', nullable: true })
  periodEndAt: Date | null;

  @Column({ name: 'cancel_requested_at', type: 'timestamptz', nullable: true })
  cancelRequestedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'retry_count', type: 'smallint', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'smallint', default: 3 })
  maxRetries: number;

  @Column({ name: 'last_failure_at', type: 'timestamptz', nullable: true })
  lastFailureAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

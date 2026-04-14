import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'billing_checkouts' })
export class BillingCheckout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80 })
  planCode: string;

  @Column({ length: 160 })
  planName: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'integer', default: 980 })
  ccy: number;

  @Column({ length: 16 })
  interval: string;

  @Column({ length: 40, default: 'created' })
  status: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  monobankStatus: string | null;

  @Column({ length: 120 })
  customerName: string;

  @Column({ length: 160 })
  customerEmail: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  companyName: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80, nullable: true })
  subscriptionId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentPageUrl: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  nextChargeDate: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellationDesc: string | null;

  @Column({ type: 'integer', default: 0 })
  totalPaid: number;

  @Column({ type: 'integer', default: 0 })
  totalFailed: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  walletStatus: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  latestChargeStatus: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  latestChargeDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastWebhookAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  latestPayload: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

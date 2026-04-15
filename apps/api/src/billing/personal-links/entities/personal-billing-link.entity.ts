import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'personal_billing_links' })
@Index('UQ_personal_billing_links_token_hash', ['tokenHash'], { unique: true })
export class PersonalBillingLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 128 })
  tokenHash: string;

  @Column({ name: 'plan_code', type: 'varchar', length: 100 })
  planCode: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 160 })
  customerName: string;

  @Column({ name: 'customer_email', type: 'varchar', length: 320 })
  customerEmail: string;

  @Column({ name: 'company_name', type: 'varchar', length: 160, nullable: true })
  companyName: string | null;

  @Column({ name: 'timezone', type: 'varchar', length: 64, nullable: true })
  timezone: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

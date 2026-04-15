import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethodStatus } from '../enums/payment-method-status.enum';

@Entity({ name: 'payment_methods' })
@Index(['clientId', 'status'])
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ type: 'varchar', length: 32 })
  provider: string;

  @Column({ name: 'card_token_encrypted', type: 'text' })
  cardTokenEncrypted: string;

  @Column({ name: 'masked_pan', type: 'varchar', length: 32, nullable: true })
  maskedPan: string | null;

  @Column({ name: 'exp_month', type: 'smallint', nullable: true })
  expMonth: number | null;

  @Column({ name: 'exp_year', type: 'smallint', nullable: true })
  expYear: number | null;

  @Column({ name: 'is_default', type: 'boolean', default: true })
  isDefault: boolean;

  @Column({
    type: 'enum',
    enum: PaymentMethodStatus,
    default: PaymentMethodStatus.Active,
  })
  status: PaymentMethodStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'disabled_at', type: 'timestamptz', nullable: true })
  disabledAt: Date | null;
}

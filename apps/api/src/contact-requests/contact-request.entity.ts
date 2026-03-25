import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'contact_requests' })
export class ContactRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  companyName: string | null;

  @Column({ length: 160 })
  email: string;

  @Column({ length: 80 })
  contact: string;

  @Column({ length: 160 })
  serviceName: string;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum PortalAccessTokenType {
  MagicLink = 'magic_link',
  Session = 'session',
}

@Entity({ name: 'portal_access_tokens' })
@Index(['email', 'tokenType'])
@Index(['tokenHash'], { unique: true })
@Index(['tokenType', 'expiresAt'])
export class PortalAccessToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ name: 'token_type', type: 'varchar', length: 16 })
  tokenType: PortalAccessTokenType;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentMethodStatus } from './enums/payment-method-status.enum';

export interface UpsertTokenizedPaymentMethodInput {
  clientId: string;
  token: string;
  maskedPan?: string;
  expMonth?: number;
  expYear?: number;
}

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodsRepository: Repository<PaymentMethod>,
  ) {}

  async upsertDefaultMonobankToken(
    input: UpsertTokenizedPaymentMethodInput,
    manager?: EntityManager,
  ): Promise<PaymentMethod> {
    const paymentMethodsRepository = manager
      ? manager.getRepository(PaymentMethod)
      : this.paymentMethodsRepository;
    const encryptedToken = this.encryptToken(input.token);

    await paymentMethodsRepository
      .createQueryBuilder()
      .update(PaymentMethod)
      .set({
        isDefault: false,
      })
      .where('client_id = :clientId', { clientId: input.clientId })
      .andWhere('provider = :provider', { provider: 'monobank' })
      .andWhere('status = :status', { status: PaymentMethodStatus.Active })
      .execute();

    const method = paymentMethodsRepository.create({
      clientId: input.clientId,
      provider: 'monobank',
      cardTokenEncrypted: encryptedToken,
      maskedPan: input.maskedPan ?? null,
      expMonth: input.expMonth ?? null,
      expYear: input.expYear ?? null,
      isDefault: true,
      status: PaymentMethodStatus.Active,
      disabledAt: null,
    });

    return paymentMethodsRepository.save(method);
  }

  async findActiveById(
    id: string,
    manager?: EntityManager,
  ): Promise<PaymentMethod | null> {
    const paymentMethodsRepository = manager
      ? manager.getRepository(PaymentMethod)
      : this.paymentMethodsRepository;

    return paymentMethodsRepository.findOne({
      where: {
        id,
        status: PaymentMethodStatus.Active,
      },
    });
  }

  decryptToken(encryptedToken: string): string {
    const key = this.getEncryptionKey();
    const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new ServiceUnavailableException(
        'Invalid encrypted card token format.',
      );
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  private encryptToken(token: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private getEncryptionKey(): Buffer {
    const keyRaw = process.env.TOKEN_ENCRYPTION_KEY;

    if (!keyRaw || keyRaw.length !== 64) {
      throw new ServiceUnavailableException(
        'TOKEN_ENCRYPTION_KEY must be a 64-char hex value.',
      );
    }

    return Buffer.from(keyRaw, 'hex');
  }
}

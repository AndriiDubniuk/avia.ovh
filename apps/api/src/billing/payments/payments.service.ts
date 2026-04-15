import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { PaymentAttempt } from './entities/payment-attempt.entity';
import { PaymentAttemptStatus } from './enums/payment-attempt-status.enum';
import { PaymentAttemptType } from './enums/payment-attempt-type.enum';

export interface CreatePaymentAttemptInput {
  subscriptionId: string;
  checkoutSessionId: string;
  amountMinor: number;
  currency: string;
  providerInvoiceId: string;
}

export interface CreateRecurringPaymentAttemptInput {
  subscriptionId: string;
  paymentMethodId: string;
  amountMinor: number;
  currency: string;
  billingPeriodKey: string;
  idempotencyKey: string;
  retryNo: number;
  scheduledFor: Date;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentAttempt)
    private readonly paymentAttemptsRepository: Repository<PaymentAttempt>,
  ) {}

  async createInitialPendingAttempt(
    input: CreatePaymentAttemptInput,
  ): Promise<PaymentAttempt> {
    const entity = this.paymentAttemptsRepository.create({
      subscriptionId: input.subscriptionId,
      paymentMethodId: null,
      checkoutSessionId: input.checkoutSessionId,
      type: PaymentAttemptType.Initial,
      status: PaymentAttemptStatus.Pending,
      amountMinor: input.amountMinor,
      currency: input.currency,
      billingPeriodKey: `initial:${input.checkoutSessionId}`,
      idempotencyKey: `init:${input.checkoutSessionId}`,
      providerPaymentId: null,
      providerInvoiceId: input.providerInvoiceId,
      failureCode: null,
      failureMessage: null,
      retryNo: 0,
      scheduledFor: null,
      finalizedAt: null,
    });

    return this.paymentAttemptsRepository.save(entity);
  }

  async createRecurringPendingAttempt(
    input: CreateRecurringPaymentAttemptInput,
    manager?: EntityManager,
  ): Promise<PaymentAttempt | null> {
    const repository = manager
      ? manager.getRepository(PaymentAttempt)
      : this.paymentAttemptsRepository;

    const entity = repository.create({
      subscriptionId: input.subscriptionId,
      paymentMethodId: input.paymentMethodId,
      checkoutSessionId: null,
      type: PaymentAttemptType.Recurring,
      status: PaymentAttemptStatus.Pending,
      amountMinor: input.amountMinor,
      currency: input.currency,
      billingPeriodKey: input.billingPeriodKey,
      idempotencyKey: input.idempotencyKey,
      providerPaymentId: null,
      providerInvoiceId: null,
      failureCode: null,
      failureMessage: null,
      retryNo: input.retryNo,
      scheduledFor: input.scheduledFor,
      finalizedAt: null,
    });

    try {
      return await repository.save(entity);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        typeof (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === 'string' &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        return null;
      }

      throw error;
    }
  }

  async listBySubscriptionId(
    subscriptionId: string,
  ): Promise<PaymentAttempt[]> {
    return this.paymentAttemptsRepository.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
  }

  async findInitialAttemptByCheckoutSessionId(
    checkoutSessionId: string,
  ): Promise<PaymentAttempt | null> {
    return this.paymentAttemptsRepository.findOne({
      where: {
        checkoutSessionId,
        type: PaymentAttemptType.Initial,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async finalizeAttemptSuccess(id: string, providerPaymentId?: string | null) {
    await this.paymentAttemptsRepository.update(
      { id },
      {
        status: PaymentAttemptStatus.Success,
        providerPaymentId: providerPaymentId ?? null,
        finalizedAt: new Date(),
        failureCode: null,
        failureMessage: null,
      },
    );
  }

  async finalizeAttemptFailure(
    id: string,
    failureCode: string,
    failureMessage?: string | null,
  ) {
    await this.paymentAttemptsRepository.update(
      { id },
      {
        status: PaymentAttemptStatus.Failed,
        failureCode,
        failureMessage: failureMessage ?? null,
        finalizedAt: new Date(),
      },
    );
  }
}

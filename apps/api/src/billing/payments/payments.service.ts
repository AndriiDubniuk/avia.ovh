import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async listBySubscriptionId(subscriptionId: string): Promise<PaymentAttempt[]> {
    return this.paymentAttemptsRepository.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
  }
}

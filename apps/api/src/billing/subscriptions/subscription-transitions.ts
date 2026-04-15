import { UnprocessableEntityException } from '@nestjs/common';
import { SubscriptionStatus } from './enums/subscription-status.enum';

const CANCELLABLE_STATUSES = new Set<SubscriptionStatus>([
  SubscriptionStatus.PendingInitialPayment,
  SubscriptionStatus.Active,
  SubscriptionStatus.PastDue,
  SubscriptionStatus.FailedInitialPayment,
  SubscriptionStatus.Suspended,
]);

export function isAlreadyCancelled(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.Cancelled;
}

export function assertCanCancelSubscription(status: SubscriptionStatus): void {
  if (isAlreadyCancelled(status)) {
    return;
  }

  if (!CANCELLABLE_STATUSES.has(status)) {
    throw new UnprocessableEntityException(
      `Subscription cannot be cancelled from status "${status}".`,
    );
  }
}

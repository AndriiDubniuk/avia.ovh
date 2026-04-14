export enum SubscriptionStatus {
  PendingInitialPayment = 'pending_initial_payment',
  Active = 'active',
  PastDue = 'past_due',
  FailedInitialPayment = 'failed_initial_payment',
  Suspended = 'suspended',
  Cancelled = 'cancelled',
}

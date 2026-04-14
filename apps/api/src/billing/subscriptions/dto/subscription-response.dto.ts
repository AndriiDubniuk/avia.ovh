import { SubscriptionInterval } from '../enums/subscription-interval.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class SubscriptionResponseDto {
  subscription_id: string;
  status: SubscriptionStatus;
  client_id: string;
  payment_method_id: string | null;
  amount_minor: number;
  currency: string;
  interval: SubscriptionInterval;
  next_charge_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

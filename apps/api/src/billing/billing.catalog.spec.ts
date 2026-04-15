import { SubscriptionInterval } from './subscriptions/enums/subscription-interval.enum';
import {
  findPublicBillingPlan,
  getPublicBillingPlans,
} from './billing.catalog';

describe('billing catalog', () => {
  const originalPlans = process.env.BILLING_PLANS_JSON;

  afterEach(() => {
    process.env.BILLING_PLANS_JSON = originalPlans;
  });

  it('parses multiple plans from BILLING_PLANS_JSON', () => {
    process.env.BILLING_PLANS_JSON = JSON.stringify([
      {
        code: 'annual',
        name: 'Annual',
        amount_minor: 29900,
        interval: SubscriptionInterval.Yearly,
      },
      {
        code: 'monthly',
        name: 'Monthly',
        amount_minor: 2900,
        interval: SubscriptionInterval.Monthly,
      },
    ]);

    const plans = getPublicBillingPlans();

    expect(plans).toHaveLength(2);
    expect(findPublicBillingPlan('monthly')?.amount_minor).toBe(2900);
  });

  it('falls back to default plan when JSON is invalid', () => {
    process.env.BILLING_PLANS_JSON = '{bad-json';

    const plans = getPublicBillingPlans();

    expect(plans).toHaveLength(1);
    expect(plans[0].code).toBeDefined();
  });
});

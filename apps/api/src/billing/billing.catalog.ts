import { SubscriptionInterval } from './subscriptions/enums/subscription-interval.enum';

export type PublicBillingPlan = {
  code: string;
  name: string;
  description: string;
  amount_minor: number;
  currency: 'UAH';
  interval: SubscriptionInterval;
  intervalLabel: string;
  priceLabel: string;
  badge: string;
  features: string[];
  note: string;
};

type RawPlan = Partial<PublicBillingPlan> & {
  code?: string;
  name?: string;
  amount_minor?: number;
  interval?: SubscriptionInterval;
};

function formatMoney(amountMinor: number) {
  return new Intl.NumberFormat('uk-UA').format(amountMinor / 100);
}

function buildDefaultPlan(): PublicBillingPlan {
  const amountMinor = Number(
    process.env.BILLING_DEFAULT_PLAN_AMOUNT_MINOR ?? 29900,
  );

  return {
    code: process.env.BILLING_DEFAULT_PLAN_CODE ?? 'annual',
    name: process.env.BILLING_DEFAULT_PLAN_NAME ?? 'Річна підписка',
    description:
      process.env.BILLING_DEFAULT_PLAN_DESCRIPTION ??
      'Щорічне автопродовження сервісу через monobank.',
    amount_minor: Number.isFinite(amountMinor) ? amountMinor : 29900,
    currency: 'UAH',
    interval: SubscriptionInterval.Yearly,
    intervalLabel: 'Щороку',
    priceLabel: `${formatMoney(Number.isFinite(amountMinor) ? amountMinor : 29900)} грн / рік`,
    badge: 'Автопродовження',
    features: [
      'Оплата карткою, Apple Pay або Google Pay.',
      'Після першого платежу зберігається токен картки.',
      'Автоматичне щорічне списання до скасування.',
    ],
    note: 'Підписку можна скасувати у будь-який час до наступного списання.',
  };
}

function normalizePlan(plan: RawPlan): PublicBillingPlan | null {
  if (!plan.code || !plan.name || !plan.amount_minor || !plan.interval) {
    return null;
  }

  const amountMinor = Number(plan.amount_minor);
  if (!Number.isFinite(amountMinor) || amountMinor < 100) {
    return null;
  }

  if (
    ![SubscriptionInterval.Monthly, SubscriptionInterval.Yearly].includes(
      plan.interval,
    )
  ) {
    return null;
  }

  const intervalLabel =
    plan.intervalLabel ??
    (plan.interval === SubscriptionInterval.Yearly ? 'Щороку' : 'Щомісяця');

  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? '',
    amount_minor: amountMinor,
    currency: 'UAH',
    interval: plan.interval,
    intervalLabel,
    priceLabel:
      plan.priceLabel ??
      `${formatMoney(amountMinor)} грн / ${plan.interval === SubscriptionInterval.Yearly ? 'рік' : 'місяць'}`,
    badge: plan.badge ?? 'План',
    features: Array.isArray(plan.features)
      ? plan.features.filter((item) => typeof item === 'string')
      : [],
    note: plan.note ?? '',
  };
}

export function getPublicBillingPlans(): PublicBillingPlan[] {
  const raw = process.env.BILLING_PLANS_JSON;

  if (!raw) {
    return [buildDefaultPlan()];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [buildDefaultPlan()];
    }

    const plans = parsed
      .map((entry) => normalizePlan(entry as RawPlan))
      .filter((entry): entry is PublicBillingPlan => entry !== null);

    return plans.length > 0 ? plans : [buildDefaultPlan()];
  } catch {
    return [buildDefaultPlan()];
  }
}

export function findPublicBillingPlan(
  code: string,
): PublicBillingPlan | undefined {
  return getPublicBillingPlans().find((plan) => plan.code === code);
}

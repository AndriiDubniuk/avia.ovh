export type BillingPlan = {
  code: string;
  name: string;
  description: string;
  amount: number;
  ccy: number;
  interval: string;
  intervalLabel: string;
  priceLabel: string;
  badge: string;
  features: string[];
  note: string;
};

function getNumberEnv(name: string, fallback: number) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMinorCurrency(amount: number, ccy: number) {
  if (ccy === 980) {
    const formatter = new Intl.NumberFormat('uk-UA');
    return `${formatter.format(amount / 100)} грн`;
  }

  return `${amount} / ${ccy}`;
}

export function getBillingPlans(): BillingPlan[] {
  const amount = getNumberEnv('BILLING_DEFAULT_PLAN_AMOUNT', 400000);
  const ccy = getNumberEnv('BILLING_DEFAULT_PLAN_CCY', 980);
  const name = process.env.BILLING_DEFAULT_PLAN_NAME ?? 'Річна підписка';
  const description =
    process.env.BILLING_DEFAULT_PLAN_DESCRIPTION ??
    'Щорічне продовження сервісу або підтримки з автоматичним списанням раз на рік.';

  return [
    {
      code: process.env.BILLING_DEFAULT_PLAN_CODE ?? 'annual',
      name,
      description,
      amount,
      ccy,
      interval: process.env.BILLING_DEFAULT_PLAN_INTERVAL ?? '1y',
      intervalLabel: 'Щороку',
      priceLabel: `${formatMinorCurrency(amount, ccy)} / рік`,
      badge: 'Автоподовження',
      features: [
        'Оплата карткою, Apple Pay або Google Pay через monobank acquiring.',
        'Після активації підписка працює як річний автоплатіж.',
        'Керування статусом і скасування доступні на сторінці результату.',
      ],
      note: 'Перший платіж підтверджує активацію підписки. Далі monobank списує кошти раз на рік, доки підписку не скасовано.',
    },
  ];
}

export function findBillingPlan(code: string) {
  return getBillingPlans().find((plan) => plan.code === code);
}

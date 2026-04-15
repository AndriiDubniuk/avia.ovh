export type BillingResultState =
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "failed_initial_payment"
  | "awaiting_payment"
  | "expired"
  | "failed"
  | string;

export type ResultStateUi = {
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "secondary";
};

export function getResultStateUi(status: BillingResultState): ResultStateUi {
  switch (status) {
    case "active":
      return {
        description:
          "Підписка активна. Наступне списання відбудеться автоматично у заплановану дату.",
        ctaLabel: "До сторінки оплати",
        ctaHref: "/",
        ctaVariant: "secondary",
      };
    case "past_due":
      return {
        description:
          "Чергове списання не пройшло. Перевірте статус та, за потреби, оновіть платіжний метод через новий checkout.",
        ctaLabel: "Оформити нову оплату",
        ctaHref: "/",
        ctaVariant: "primary",
      };
    case "suspended":
      return {
        description:
          "Підписку призупинено після кількох невдалих списань. Щоб продовжити, потрібно оформити новий checkout.",
        ctaLabel: "Відновити через checkout",
        ctaHref: "/",
        ctaVariant: "primary",
      };
    case "cancelled":
      return {
        description:
          "Автопродовження вимкнено. Нових списань більше не буде, доки ви не оформите підписку знову.",
        ctaLabel: "Оформити нову підписку",
        ctaHref: "/",
        ctaVariant: "secondary",
      };
    case "failed_initial_payment":
    case "failed":
      return {
        description:
          "Перший платіж не підтверджено. Спробуйте оплату ще раз через новий checkout.",
        ctaLabel: "Спробувати ще раз",
        ctaHref: "/",
        ctaVariant: "primary",
      };
    case "expired":
      return {
        description:
          "Checkout сесія прострочена. Створіть нову сесію оплати для продовження.",
        ctaLabel: "Створити новий checkout",
        ctaHref: "/",
        ctaVariant: "primary",
      };
    case "awaiting_payment":
      return {
        description: "Очікуємо підтвердження першого платежу у monobank.",
        ctaLabel: "Оновити статус",
        ctaHref: "#refresh",
        ctaVariant: "secondary",
      };
    default:
      return {
        description: "Оновлюємо статус підписки та синхронізуємось із платіжним провайдером.",
        ctaLabel: "Оновити статус",
        ctaHref: "#refresh",
        ctaVariant: "secondary",
      };
  }
}

export function shouldStopPolling(status: BillingResultState): boolean {
  return [
    "active",
    "cancelled",
    "expired",
    "failed",
    "failed_initial_payment",
    "past_due",
    "suspended",
  ].includes(status);
}

export function isCancelActionVisible(status: BillingResultState, canCancel: boolean): boolean {
  if (!canCancel) {
    return false;
  }

  return ["active", "awaiting_payment", "past_due"].includes(status);
}

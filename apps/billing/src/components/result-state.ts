import { DICT, type Dict } from "@/lib/i18n";

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

type StateKey = keyof Dict["states"];

/** Маршрут і вигляд кнопки не залежать від мови — лише від стану. */
const SHAPE: Record<StateKey, { href: string; variant: "primary" | "secondary" }> = {
  active: { href: "/", variant: "secondary" },
  past_due: { href: "/", variant: "primary" },
  suspended: { href: "/", variant: "primary" },
  cancelled: { href: "/", variant: "secondary" },
  failed: { href: "/", variant: "primary" },
  expired: { href: "/", variant: "primary" },
  awaiting_payment: { href: "#refresh", variant: "secondary" },
  unknown: { href: "#refresh", variant: "secondary" },
};

function stateKey(status: BillingResultState): StateKey {
  switch (status) {
    case "active":
    case "past_due":
    case "suspended":
    case "cancelled":
    case "expired":
    case "awaiting_payment":
      return status;
    case "failed_initial_payment":
    case "failed":
      return "failed";
    default:
      return "unknown";
  }
}

/** Словник необовʼязковий: без нього повертається українська — мова за замовчуванням. */
export function getResultStateUi(
  status: BillingResultState,
  t: Dict = DICT.ua,
): ResultStateUi {
  const key = stateKey(status);
  const copy = t.states[key];
  const shape = SHAPE[key];

  return {
    description: copy.description,
    ctaLabel: copy.ctaLabel,
    ctaHref: shape.href,
    ctaVariant: shape.variant,
  };
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

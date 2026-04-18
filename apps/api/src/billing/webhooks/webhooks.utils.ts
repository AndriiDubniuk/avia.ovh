import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';

export type MonobankWebhookStatus =
  | 'success'
  | 'failure'
  | 'reversed'
  | 'expired'
  | 'unknown';

export function getEventKey(payload: Record<string, unknown>): string {
  const invoiceId =
    asString(payload.invoiceId) ??
    asString(payload.invoice_id) ??
    'unknown-invoice';
  const status = asString(payload.status) ?? 'unknown-status';
  const modifiedDate =
    asString(payload.modifiedDate) ??
    asString(payload.createdDate) ??
    'unknown-date';

  return `${invoiceId}:${status}:${modifiedDate}`;
}

export function getEventType(payload: Record<string, unknown>): string {
  return asString(payload.type) ?? 'payment';
}

export function getInvoiceId(payload: Record<string, unknown>): string | null {
  return asString(payload.invoiceId) ?? asString(payload.invoice_id) ?? null;
}

export function getSubscriptionId(
  payload: Record<string, unknown>,
): string | null {
  return (
    asString(payload.subscriptionId) ??
    asString(payload.subscription_id) ??
    asString(payload.walletId) ??
    null
  );
}

export function getProviderPaymentId(
  payload: Record<string, unknown>,
): string | null {
  return asString(payload.paymentId) ?? asString(payload.payment_id) ?? null;
}

export function getStatus(
  payload: Record<string, unknown>,
): MonobankWebhookStatus {
  const status = (asString(payload.status) ?? '').toLowerCase();

  if (status === 'success' || status === 'paid') {
    return 'success';
  }

  if (status === 'expired') {
    return 'expired';
  }

  if (status === 'failure' || status === 'failed') {
    return 'failure';
  }

  if (status === 'reversed') {
    return 'reversed';
  }

  return 'unknown';
}

export function extractToken(payload: Record<string, unknown>): string | null {
  const walletData = payload.walletData;
  if (!walletData || typeof walletData !== 'object') {
    return null;
  }

  const token = (walletData as Record<string, unknown>).cardToken;
  return asString(token);
}

export function extractMaskedPan(
  payload: Record<string, unknown>,
): string | null {
  const walletData = payload.walletData;
  if (!walletData || typeof walletData !== 'object') {
    return null;
  }

  return asString((walletData as Record<string, unknown>).maskedPan);
}

export function extractExpMonth(
  payload: Record<string, unknown>,
): number | null {
  const walletData = payload.walletData;
  if (!walletData || typeof walletData !== 'object') {
    return null;
  }

  const month = (walletData as Record<string, unknown>).expMonth;
  return typeof month === 'number' ? month : null;
}

export function extractExpYear(
  payload: Record<string, unknown>,
): number | null {
  const walletData = payload.walletData;
  if (!walletData || typeof walletData !== 'object') {
    return null;
  }

  const year = (walletData as Record<string, unknown>).expYear;
  return typeof year === 'number' ? year : null;
}

export function computeNextChargeDates(input: {
  interval: SubscriptionInterval;
  anchorDay: number;
  fromDate?: Date;
}): { nextChargeAt: Date; periodEndAt: Date } {
  const base = input.fromDate ?? new Date();
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();

  if (input.interval === SubscriptionInterval.Monthly) {
    const nextMonthDate = buildDateWithAnchor(year, month + 1, input.anchorDay);
    return {
      nextChargeAt: nextMonthDate,
      periodEndAt: nextMonthDate,
    };
  }

  const yearlyDate = buildDateWithAnchor(year + 1, month, input.anchorDay);
  return {
    nextChargeAt: yearlyDate,
    periodEndAt: yearlyDate,
  };
}

function buildDateWithAnchor(
  year: number,
  month: number,
  anchorDay: number,
): Date {
  const normalized = new Date(Date.UTC(year, month, 1, 9, 0, 0, 0));
  const lastDay = new Date(
    Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(anchorDay, lastDay);

  return new Date(
    Date.UTC(
      normalized.getUTCFullYear(),
      normalized.getUTCMonth(),
      day,
      9,
      0,
      0,
      0,
    ),
  );
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

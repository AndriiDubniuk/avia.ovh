import { SubscriptionInterval } from '../subscriptions/enums/subscription-interval.enum';

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function resolveTimeZone(timeZone: string) {
  try {
    // Validate timezone early and fallback safely for invalid values.
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return 'UTC';
  }
}

function getZonedDateParts(date: Date, timeZone: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolveTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toUtcDateFromZonedParts(
  parts: ZonedDateParts,
  timeZone: string,
): Date {
  const targetAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0,
  );

  let guessUtc = targetAsUtc;
  const resolvedTimeZone = resolveTimeZone(timeZone);

  for (let index = 0; index < 4; index += 1) {
    const actualLocal = getZonedDateParts(new Date(guessUtc), resolvedTimeZone);
    const actualAsUtc = Date.UTC(
      actualLocal.year,
      actualLocal.month - 1,
      actualLocal.day,
      actualLocal.hour,
      actualLocal.minute,
      actualLocal.second,
      0,
    );

    const diff = targetAsUtc - actualAsUtc;
    if (diff === 0) {
      break;
    }

    guessUtc += diff;
  }

  return new Date(guessUtc);
}

function addDaysInLocalCalendar(
  parts: ZonedDateParts,
  daysToAdd: number,
): ZonedDateParts {
  const base = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + daysToAdd, 0, 0, 0, 0),
  );

  return {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

export function computeNextChargeDatesForTimezone(input: {
  interval: SubscriptionInterval;
  anchorDay: number;
  fromDate: Date;
  clientTimezone: string;
}): { nextChargeAt: Date; periodEndAt: Date } {
  const local = getZonedDateParts(input.fromDate, input.clientTimezone);
  const monthShift = input.interval === SubscriptionInterval.Monthly ? 1 : 12;
  const monthIndex = local.month - 1 + monthShift;
  const targetYear = local.year + Math.floor(monthIndex / 12);
  const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12;
  const targetMonth = normalizedMonthIndex + 1;
  const targetDay = Math.min(
    Math.max(1, input.anchorDay),
    daysInMonth(targetYear, targetMonth),
  );

  const zonedTarget: ZonedDateParts = {
    year: targetYear,
    month: targetMonth,
    day: targetDay,
    hour: local.hour,
    minute: local.minute,
    second: local.second,
  };
  const nextChargeAt = toUtcDateFromZonedParts(
    zonedTarget,
    input.clientTimezone,
  );

  return {
    nextChargeAt,
    periodEndAt: nextChargeAt,
  };
}

export function computeRetryScheduleDate(input: {
  failedAt: Date;
  retryCount: number;
  clientTimezone: string;
}): Date | null {
  const retryOffsetsByCount: Record<number, number> = {
    1: 1,
    2: 3,
    3: 5,
  };

  const daysToAdd = retryOffsetsByCount[input.retryCount];
  if (!daysToAdd) {
    return null;
  }

  const local = getZonedDateParts(input.failedAt, input.clientTimezone);
  const shifted = addDaysInLocalCalendar(local, daysToAdd);

  return toUtcDateFromZonedParts(shifted, input.clientTimezone);
}

export function buildRecurringBillingPeriodKey(input: {
  subscriptionId: string;
  interval: SubscriptionInterval;
  periodReferenceDate: Date;
  clientTimezone: string;
}): string {
  const local = getZonedDateParts(
    input.periodReferenceDate,
    input.clientTimezone,
  );
  const periodLabel =
    input.interval === SubscriptionInterval.Monthly
      ? `${local.year}-${String(local.month).padStart(2, '0')}`
      : `${local.year}`;

  return `recurring:${input.subscriptionId}:${periodLabel}`;
}

export function buildRecurringIdempotencyKey(input: {
  subscriptionId: string;
  billingPeriodKey: string;
  retryNo: number;
}): string {
  return `rec:${input.subscriptionId}:${input.billingPeriodKey}:r${input.retryNo}`;
}

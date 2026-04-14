export function sanitizeMonobankPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMonobankPayload(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'cardToken')
      .map(([key, nestedValue]) => [key, sanitizeMonobankPayload(nestedValue)]);

    return Object.fromEntries(entries);
  }

  return value;
}

export function parseNullableDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function mapBillingCheckoutStatus(monobankStatus?: string | null) {
  switch (monobankStatus) {
    case 'active':
      return 'active';
    case 'cancelled':
      return 'cancelled';
    case 'created':
      return 'awaiting_payment';
    case 'expired':
      return 'expired';
    case 'failure':
    case 'failed':
      return 'failed';
    case 'paused':
      return 'paused';
    default:
      return monobankStatus ? 'pending' : 'created';
  }
}

export function findSubscriptionId(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if ('subscriptionId' in value && typeof value.subscriptionId === 'string') {
    return value.subscriptionId;
  }

  for (const nested of Object.values(value as Record<string, unknown>)) {
    const found = findSubscriptionId(nested);

    if (found) {
      return found;
    }
  }

  return null;
}

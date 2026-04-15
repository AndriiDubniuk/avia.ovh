import { createHash } from 'crypto';

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    return Object.fromEntries(
      entries.map(([key, val]) => [key, sortValue(val)]),
    );
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function hashPayload(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

type RawEnv = Record<string, unknown>;

function parseString(value: unknown, fallback: string) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }

  return fallback;
}

function parseNumber(value: unknown, fallback: number, name: string) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return parsed;
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return fallback;
}

export function validateEnv(config: RawEnv) {
  const appEnv = parseString(config.APP_ENV, 'local');

  return {
    APP_ENV: appEnv,
    PORT: parseNumber(config.PORT, 3001, 'PORT'),
    FRONTEND_ORIGIN: parseString(
      config.FRONTEND_ORIGIN,
      'http://localhost:3000',
    ),
    DB_HOST: parseString(config.DB_HOST, 'localhost'),
    DB_PORT: parseNumber(config.DB_PORT, 5432, 'DB_PORT'),
    DB_USER: parseString(config.DB_USER, 'avia'),
    DB_PASSWORD: parseString(config.DB_PASSWORD, 'avia'),
    DB_NAME: parseString(config.DB_NAME, 'avia_agro'),
    DB_SSL: parseBoolean(config.DB_SSL, false),
    TYPEORM_SYNCHRONIZE: parseBoolean(
      config.TYPEORM_SYNCHRONIZE,
      appEnv === 'local',
    ),
    MONOBANK_API_BASE_URL: parseString(
      config.MONOBANK_API_BASE_URL,
      'https://api.monobank.ua',
    ),
    MONOBANK_TOKEN: parseString(config.MONOBANK_TOKEN, ''),
    IDEMPOTENCY_TTL_HOURS: parseNumber(
      config.IDEMPOTENCY_TTL_HOURS,
      72,
      'IDEMPOTENCY_TTL_HOURS',
    ),
  };
}

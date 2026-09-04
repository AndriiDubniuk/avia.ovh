type RawEnv = Record<string, unknown>;
type MonobankMode = 'mock' | 'real';

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

function parseMonobankMode(value: unknown): MonobankMode {
  const normalized = parseString(value, 'mock').trim().toLowerCase();

  if (normalized === 'mock' || normalized === 'real') {
    return normalized;
  }

  throw new Error(
    'Environment variable MONOBANK_MODE must be either "mock" or "real".',
  );
}

function isPlaceholderToken(value: string) {
  const normalized = value.trim().toLowerCase();
  const placeholders = new Set([
    '',
    'your_token',
    'your-monobank-token',
    'changeme',
    'placeholder',
  ]);

  return placeholders.has(normalized);
}

function parseRequiredUrl(value: string, name: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`Environment variable ${name} must be a valid URL.`);
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.protocol || !parsed.host) {
      throw new Error('Invalid URL.');
    }
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL.`);
  }
}

export function validateEnv(config: RawEnv) {
  const appEnv = parseString(config.APP_ENV, 'local');
  const monobankMode = parseMonobankMode(config.MONOBANK_MODE);
  const monobankToken = parseString(config.MONOBANK_TOKEN, '');
  const monobankWebhookUrl = parseString(config.MONOBANK_WEBHOOK_URL, '');
  const monobankAcquiringToken = parseString(
    config.MONOBANK_ACQUIRING_TOKEN,
    '',
  );

  if (monobankMode === 'real' && isPlaceholderToken(monobankToken)) {
    throw new Error(
      'MONOBANK_TOKEN is required in MONOBANK_MODE=real and cannot be a placeholder value.',
    );
  }

  if (monobankMode === 'real') {
    parseRequiredUrl(monobankWebhookUrl, 'MONOBANK_WEBHOOK_URL');
    if (isPlaceholderToken(monobankAcquiringToken)) {
      throw new Error(
        'MONOBANK_ACQUIRING_TOKEN is required in MONOBANK_MODE=real and cannot be a placeholder value.',
      );
    }
  }

  const resendApiKey = parseString(config.RESEND_API_KEY, '');
  const resendFromEmail = parseString(config.RESEND_FROM_EMAIL, '');
  const billingNotificationToEmail = parseString(
    config.BILLING_NOTIFICATION_TO_EMAIL,
    '',
  );

  if (appEnv !== 'test') {
    if (!resendApiKey.trim()) {
      throw new Error('RESEND_API_KEY is required.');
    }
    if (!resendFromEmail.trim()) {
      throw new Error('RESEND_FROM_EMAIL is required.');
    }
    if (!billingNotificationToEmail.trim()) {
      throw new Error('BILLING_NOTIFICATION_TO_EMAIL is required.');
    }
  }

  /* Пошта контактної форми йде власним SMTP, а не через Resend: Resend
     обслуговує білінг і лишається без змін. Хост не обовʼязковий — без нього
     заявка просто зберігається в базі, а сервіс пише попередження в лог. */
  const smtpHost = parseString(config.SMTP_HOST, '');
  const smtpFromEmail = parseString(config.SMTP_FROM_EMAIL, '');

  if (appEnv !== 'test' && smtpHost.trim() && !smtpFromEmail.trim()) {
    throw new Error('SMTP_FROM_EMAIL is required when SMTP_HOST is set.');
  }

  /* Telegram — другий канал сповіщень про заявку, поряд із поштою. Обидва
     необовʼязкові: без токена або чату сервіс просто пише попередження. */
  const telegramBotToken = parseString(config.TELEGRAM_BOT_TOKEN, '');
  const telegramChatId = parseString(config.TELEGRAM_CHAT_ID, '');

  if (appEnv !== 'test' && telegramBotToken.trim() && !telegramChatId.trim()) {
    throw new Error(
      'TELEGRAM_CHAT_ID is required when TELEGRAM_BOT_TOKEN is set.',
    );
  }

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
    MONOBANK_MODE: monobankMode,
    MONOBANK_TOKEN: monobankToken,
    MONOBANK_WEBHOOK_URL: monobankWebhookUrl,
    MONOBANK_ACQUIRING_TOKEN: monobankAcquiringToken,
    TOKEN_ENCRYPTION_KEY: parseString(config.TOKEN_ENCRYPTION_KEY, ''),
    IDEMPOTENCY_TTL_HOURS: parseNumber(
      config.IDEMPOTENCY_TTL_HOURS,
      72,
      'IDEMPOTENCY_TTL_HOURS',
    ),
    BILLING_PUBLIC_URL: parseString(
      config.BILLING_PUBLIC_URL,
      'http://localhost:3002',
    ),
    BILLING_PUBLIC_API_URL: parseString(
      config.BILLING_PUBLIC_API_URL,
      'http://localhost:3001',
    ),
    BILLING_PERSONAL_LINK_BASE_URL: parseString(
      config.BILLING_PERSONAL_LINK_BASE_URL,
      '',
    ),
    BILLING_PERSONAL_LINK_TTL_HOURS: parseNumber(
      config.BILLING_PERSONAL_LINK_TTL_HOURS,
      72,
      'BILLING_PERSONAL_LINK_TTL_HOURS',
    ),
    BILLING_PRIVATE_MODE: parseBoolean(config.BILLING_PRIVATE_MODE, false),
    BILLING_PLANS_JSON: parseString(config.BILLING_PLANS_JSON, ''),
    BILLING_PORTAL_MAGIC_TTL_MINUTES: parseNumber(
      config.BILLING_PORTAL_MAGIC_TTL_MINUTES,
      15,
      'BILLING_PORTAL_MAGIC_TTL_MINUTES',
    ),
    BILLING_PORTAL_SESSION_TTL_HOURS: parseNumber(
      config.BILLING_PORTAL_SESSION_TTL_HOURS,
      24,
      'BILLING_PORTAL_SESSION_TTL_HOURS',
    ),
    BILLING_PORTAL_COOKIE_NAME: parseString(
      config.BILLING_PORTAL_COOKIE_NAME,
      'billing_portal_session',
    ),
    RESEND_API_KEY: resendApiKey,
    RESEND_FROM_EMAIL: resendFromEmail,
    BILLING_NOTIFICATION_TO_EMAIL: billingNotificationToEmail,
    SMTP_HOST: smtpHost,
    SMTP_PORT: parseNumber(config.SMTP_PORT, 587, 'SMTP_PORT'),
    SMTP_SECURE: parseBoolean(config.SMTP_SECURE, false),
    SMTP_USER: parseString(config.SMTP_USER, ''),
    SMTP_PASSWORD: parseString(config.SMTP_PASSWORD, ''),
    SMTP_FROM_EMAIL: smtpFromEmail,
    CONTACT_NOTIFICATION_TO_EMAIL: parseString(
      config.CONTACT_NOTIFICATION_TO_EMAIL,
      'sales@avia.ovh',
    ),
    TELEGRAM_BOT_TOKEN: telegramBotToken,
    TELEGRAM_CHAT_ID: telegramChatId,
  };
}

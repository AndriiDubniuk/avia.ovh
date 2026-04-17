import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('allows mock mode without token', () => {
    const env = validateEnv({
      APP_ENV: 'test',
      MONOBANK_MODE: 'mock',
      MONOBANK_TOKEN: '',
      MONOBANK_WEBHOOK_URL: '',
    });

    expect(env.MONOBANK_MODE).toBe('mock');
    expect(env.MONOBANK_TOKEN).toBe('');
  });

  it('throws in real mode when token is missing', () => {
    expect(() =>
      validateEnv({
        APP_ENV: 'test',
        MONOBANK_MODE: 'real',
        MONOBANK_TOKEN: '',
      }),
    ).toThrow(
      'MONOBANK_TOKEN is required in MONOBANK_MODE=real and cannot be a placeholder value.',
    );
  });

  it('throws in real mode when webhook url is missing', () => {
    expect(() =>
      validateEnv({
        APP_ENV: 'test',
        MONOBANK_MODE: 'real',
        MONOBANK_TOKEN: 'real-token',
        MONOBANK_WEBHOOK_URL: '',
      }),
    ).toThrow('Environment variable MONOBANK_WEBHOOK_URL must be a valid URL.');
  });

  it('throws in real mode when webhook url is invalid', () => {
    expect(() =>
      validateEnv({
        APP_ENV: 'test',
        MONOBANK_MODE: 'real',
        MONOBANK_TOKEN: 'real-token',
        MONOBANK_WEBHOOK_URL: 'not-a-url',
      }),
    ).toThrow('Environment variable MONOBANK_WEBHOOK_URL must be a valid URL.');
  });

  it('throws in real mode when MONOBANK_ACQUIRING_TOKEN is missing', () => {
    expect(() =>
      validateEnv({
        APP_ENV: 'test',
        MONOBANK_MODE: 'real',
        MONOBANK_TOKEN: 'real-token',
        MONOBANK_WEBHOOK_URL: 'https://api.example.com/v1/billing/webhooks/monobank',
        MONOBANK_ACQUIRING_TOKEN: '',
      }),
    ).toThrow(
      'MONOBANK_ACQUIRING_TOKEN is required in MONOBANK_MODE=real and cannot be a placeholder value.',
    );
  });
});

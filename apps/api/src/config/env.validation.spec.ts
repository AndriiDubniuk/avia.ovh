import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('allows mock mode without token', () => {
    const env = validateEnv({ MONOBANK_MODE: 'mock', MONOBANK_TOKEN: '' });

    expect(env.MONOBANK_MODE).toBe('mock');
    expect(env.MONOBANK_TOKEN).toBe('');
  });

  it('throws in real mode when token is missing', () => {
    expect(() =>
      validateEnv({ MONOBANK_MODE: 'real', MONOBANK_TOKEN: '' }),
    ).toThrow(
      'MONOBANK_TOKEN is required in MONOBANK_MODE=real and cannot be a placeholder value.',
    );
  });
});

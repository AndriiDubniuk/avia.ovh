import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  assertPublicBillingFlowAllowed,
  isBillingPrivateModeEnabled,
} from './billing-private-mode.util';

describe('billing private mode util', () => {
  it('returns false when private mode is not enabled', () => {
    const configService = {
      get: jest.fn().mockReturnValue('false'),
    } as unknown as ConfigService;

    expect(isBillingPrivateModeEnabled(configService)).toBe(false);
  });

  it('throws forbidden when private mode is enabled', () => {
    const configService = {
      get: jest.fn().mockReturnValue('true'),
    } as unknown as ConfigService;

    expect(() => assertPublicBillingFlowAllowed(configService)).toThrow(
      ForbiddenException,
    );
  });
});

import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function parseBooleanFlag(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return value.trim().toLowerCase() === 'true';
}

export function isBillingPrivateModeEnabled(configService: ConfigService) {
  return parseBooleanFlag(configService.get('BILLING_PRIVATE_MODE'));
}

export function assertPublicBillingFlowAllowed(configService: ConfigService) {
  if (isBillingPrivateModeEnabled(configService)) {
    throw new ForbiddenException(
      'Public billing flow is temporarily disabled.',
    );
  }
}

import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function parseBooleanFlag(value: string | undefined) {
  if (!value) {
    return false;
  }

  return value.trim().toLowerCase() === 'true';
}

export function isBillingPrivateModeEnabled(configService: ConfigService) {
  return parseBooleanFlag(configService.get<string>('BILLING_PRIVATE_MODE'));
}

export function assertPublicBillingFlowAllowed(configService: ConfigService) {
  if (isBillingPrivateModeEnabled(configService)) {
    throw new ForbiddenException(
      'Public billing flow is temporarily disabled.',
    );
  }
}

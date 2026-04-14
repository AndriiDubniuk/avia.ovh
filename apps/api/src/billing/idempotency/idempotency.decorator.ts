import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_METADATA_KEY = 'use-idempotency';
export const UseIdempotency = () => SetMetadata(IDEMPOTENCY_METADATA_KEY, true);

import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { IDEMPOTENCY_METADATA_KEY } from './idempotency.decorator';
import { IdempotencyService } from './idempotency.service';
import { hashPayload, stableStringify } from './stable-json.util';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const useIdempotency = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!useIdempotency) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<{
      method: string;
      url: string;
      body?: unknown;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const response = http.getResponse<{
      statusCode?: number;
      header: (name: string, value: string) => void;
      status: (code: number) => { json: (payload: unknown) => unknown };
    }>();

    const idempotencyHeader = request.headers['idempotency-key'];
    const idempotencyKey = Array.isArray(idempotencyHeader)
      ? idempotencyHeader[0]
      : idempotencyHeader;
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required.');
    }

    const route = `${request.method}:${request.url}`;
    const payload = `${request.method}|${request.url}|${stableStringify(request.body ?? {})}`;
    const requestHash = hashPayload(payload);

    return from(
      this.idempotencyService.findByKeyAndRoute(idempotencyKey, route),
    ).pipe(
      mergeMap((record) => {
        if (record) {
          if (record.requestHash !== requestHash) {
            throw new ConflictException(
              'Idempotency key is already used with a different payload.',
            );
          }

          response.header('Idempotency-Replayed', 'true');
          response.status(record.responseStatus);
          return from([record.responseJson]);
        }

        return next.handle().pipe(
          mergeMap(async (result: unknown) => {
            const responseStatus = response.statusCode ?? 200;
            if (responseStatus >= 200 && responseStatus < 300) {
              await this.idempotencyService.saveRecord({
                idempotencyKey,
                route,
                requestHash,
                responseStatus,
                responseJson: (result ?? {}) as Record<string, unknown>,
              });
            }

            return result;
          }),
        );
      }),
    );
  }
}

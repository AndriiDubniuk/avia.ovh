import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IDEMPOTENCY_METADATA_KEY } from './idempotency.decorator';
import { IdempotencyService } from './idempotency.service';
import { hashPayload, stableStringify } from './stable-json.util';

function createContext(options: {
  method?: string;
  url?: string;
  body?: unknown;
  key?: string;
}) {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    header(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return {
        json: (payload: unknown) => payload,
      };
    },
  };

  const request = {
    method: options.method ?? 'POST',
    url: options.url ?? '/v1/billing/subscriptions',
    body: options.body ?? { a: 1 },
    headers: {
      'idempotency-key': options.key,
    },
  };

  return {
    context: {
      getHandler: () => 'handler',
      getClass: () => 'class',
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext,
    response,
  };
}

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let service: jest.Mocked<IdempotencyService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    service = {
      findByKeyAndRoute: jest.fn(),
      saveRecord: jest.fn(),
    } as unknown as jest.Mocked<IdempotencyService>;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    reflector.getAllAndOverride.mockReturnValue(true);
    interceptor = new IdempotencyInterceptor(reflector, service);
  });

  it('replays stored response when key and payload match', (done) => {
    const { context, response } = createContext({ key: 'k-1' });
    const requestHash = hashPayload(
      `POST|/v1/billing/subscriptions|${stableStringify({ a: 1 })}`,
    );

    service.findByKeyAndRoute.mockResolvedValue({
      idempotencyKey: 'k-1',
      route: 'POST:/v1/billing/subscriptions',
      requestHash,
      responseStatus: 201,
      responseJson: { subscription_id: 'sub-1' },
    } as never);

    const next = {
      handle: () => of({}),
    } as CallHandler;

    interceptor.intercept(context, next).subscribe((value) => {
      expect(value).toEqual({ subscription_id: 'sub-1' });
      expect(response.headers['Idempotency-Replayed']).toBe('true');
      done();
    });
  });

  it('throws conflict when same key has different payload hash', (done) => {
    const { context } = createContext({ key: 'k-3', body: { amount: 1000 } });
    service.findByKeyAndRoute.mockResolvedValue({
      requestHash: 'different-hash',
      responseStatus: 201,
      responseJson: { ok: true },
    } as never);

    const next = {
      handle: () => of({}),
    } as CallHandler;

    interceptor.intercept(context, next).subscribe({
      error: (error: { status: number }) => {
        expect(error.status).toBe(409);
        done();
      },
    });
  });

  it('stores successful response for a fresh key', (done) => {
    const { context } = createContext({ key: 'k-2' });
    service.findByKeyAndRoute.mockResolvedValue(null);
    service.saveRecord.mockResolvedValue({} as never);

    const next = {
      handle: () => of({ ok: true }),
    } as CallHandler;

    interceptor.intercept(context, next).subscribe((value) => {
      expect(value).toEqual({ ok: true });
      expect(service.saveRecord).toHaveBeenCalled();
      done();
    });
  });

  it('does not run when metadata disabled', (done) => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IDEMPOTENCY_METADATA_KEY) {
        return false as never;
      }
      return undefined as never;
    });

    const { context } = createContext({ key: undefined });
    const next = {
      handle: () => of({ ok: true }),
    } as CallHandler;

    interceptor.intercept(context, next).subscribe((value) => {
      expect(value).toEqual({ ok: true });
      done();
    });
  });
});

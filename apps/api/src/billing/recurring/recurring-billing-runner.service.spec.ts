import { ConfigService } from '@nestjs/config';
import { RecurringBillingRunnerService } from './recurring-billing-runner.service';
import { RecurringBillingService } from './recurring-billing.service';

describe('RecurringBillingRunnerService', () => {
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;

  afterEach(() => {
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    jest.restoreAllMocks();
  });

  it('starts worker and runs recurring batches automatically', async () => {
    const recurringBillingService = {
      runDueCharges: jest
        .fn()
        .mockResolvedValueOnce({ processed: 50 })
        .mockResolvedValueOnce({ processed: 12 }),
    } as unknown as jest.Mocked<RecurringBillingService>;

    const configService = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          APP_ENV: 'local',
          BILLING_RECURRING_WORKER_ENABLED: 'true',
          BILLING_RECURRING_WORKER_INTERVAL_MS: '1000',
          BILLING_RECURRING_WORKER_BATCH_SIZE: '50',
          BILLING_RECURRING_WORKER_MAX_CYCLES_PER_TICK: '3',
        };
        return map[key];
      }),
    } as unknown as ConfigService;

    let scheduledCallback: (() => void) | null = null;
    global.setInterval = jest
      .fn()
      .mockImplementation((callback: () => void) => {
        scheduledCallback = callback;
        return {} as NodeJS.Timeout;
      }) as typeof setInterval;
    global.clearInterval = jest.fn() as typeof clearInterval;

    const service = new RecurringBillingRunnerService(
      recurringBillingService,
      configService,
    );

    service.onModuleInit();
    await new Promise((resolve) => setImmediate(resolve));

    expect(recurringBillingService.runDueCharges).toHaveBeenNthCalledWith(1, 50);
    expect(recurringBillingService.runDueCharges).toHaveBeenNthCalledWith(2, 50);
    expect(scheduledCallback).not.toBeNull();

    service.onModuleDestroy();
  });

  it('does not start worker in test environment', async () => {
    const recurringBillingService = {
      runDueCharges: jest.fn(),
    } as unknown as jest.Mocked<RecurringBillingService>;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'APP_ENV') {
          return 'test';
        }

        return undefined;
      }),
    } as unknown as ConfigService;

    global.setInterval = jest.fn() as typeof setInterval;
    const service = new RecurringBillingRunnerService(
      recurringBillingService,
      configService,
    );

    service.onModuleInit();
    await new Promise((resolve) => setImmediate(resolve));

    expect(global.setInterval).not.toHaveBeenCalled();
    expect(recurringBillingService.runDueCharges).not.toHaveBeenCalled();
  });
});

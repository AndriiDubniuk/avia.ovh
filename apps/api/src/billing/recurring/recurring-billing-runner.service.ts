import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecurringBillingService } from './recurring-billing.service';

@Injectable()
export class RecurringBillingRunnerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RecurringBillingRunnerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly recurringBillingService: RecurringBillingService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    if (!this.isEnabled()) {
      this.logger.log('Recurring worker is disabled by configuration.');
      return;
    }

    const intervalMs = this.getIntervalMs();
    this.logger.log(
      `Recurring worker started. interval_ms=${intervalMs} batch_size=${this.getBatchSize()} max_cycles_per_tick=${this.getMaxCyclesPerTick()}`,
    );

    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);

    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const batchSize = this.getBatchSize();
      const maxCycles = this.getMaxCyclesPerTick();

      for (let cycle = 0; cycle < maxCycles; cycle += 1) {
        const result = await this.recurringBillingService.runDueCharges(
          batchSize,
        );

        if (result.processed < batchSize) {
          break;
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Recurring tick failed.';
      this.logger.error(message);
    } finally {
      this.isRunning = false;
    }
  }

  private isEnabled() {
    const appEnv = this.normalizeString(
      this.configService.get('APP_ENV'),
      'local',
    ).toLowerCase();
    const enabled = this.normalizeBoolean(
      this.configService.get('BILLING_RECURRING_WORKER_ENABLED'),
      true,
    );

    if (appEnv === 'test') {
      return false;
    }

    return enabled;
  }

  private getIntervalMs() {
    const raw = Number(
      this.configService.get('BILLING_RECURRING_WORKER_INTERVAL_MS') ?? 30000,
    );

    if (!Number.isFinite(raw) || raw < 1000) {
      return 30000;
    }

    return raw;
  }

  private getBatchSize() {
    const raw = Number(
      this.configService.get('BILLING_RECURRING_WORKER_BATCH_SIZE') ?? 50,
    );

    if (!Number.isFinite(raw) || raw < 1) {
      return 50;
    }

    return Math.floor(raw);
  }

  private getMaxCyclesPerTick() {
    const raw = Number(
      this.configService.get('BILLING_RECURRING_WORKER_MAX_CYCLES_PER_TICK') ??
        3,
    );

    if (!Number.isFinite(raw) || raw < 1) {
      return 3;
    }

    return Math.floor(raw);
  }

  private normalizeString(value: unknown, fallback: string) {
    if (typeof value === 'string') {
      return value.trim() || fallback;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return `${value}`.trim() || fallback;
    }

    return fallback;
  }

  private normalizeBoolean(value: unknown, fallback: boolean) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      return value.trim().toLowerCase() === 'true';
    }

    return fallback;
  }
}

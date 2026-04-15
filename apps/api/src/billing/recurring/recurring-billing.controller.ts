import { Controller, Post } from '@nestjs/common';
import { RecurringBillingService } from './recurring-billing.service';

@Controller('internal/billing')
export class RecurringBillingController {
  constructor(
    private readonly recurringBillingService: RecurringBillingService,
  ) {}

  @Post('run-due-charges')
  async runDueCharges() {
    return this.recurringBillingService.runDueCharges();
  }
}

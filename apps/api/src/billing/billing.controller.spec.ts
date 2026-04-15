import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController private mode', () => {
  it('blocks checkout creation in private mode', async () => {
    const billingService = {
      createCheckout: jest.fn(),
    } as unknown as BillingService;
    const configService = {
      get: jest.fn().mockReturnValue('true'),
    } as unknown as ConfigService;

    const controller = new BillingController(billingService, configService);

    expect(() =>
      controller.createCheckout({
        planCode: 'avia_annual_uah_29900',
        customerName: 'Test',
        customerEmail: 'test@example.com',
      }),
    ).toThrow(ForbiddenException);
    expect(billingService.createCheckout).not.toHaveBeenCalled();
  });
});

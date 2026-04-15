import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service';

type RequestWithRawBody = Request & {
  rawBody?: Buffer;
};

function getRawBody(request: RequestWithRawBody) {
  if (request.rawBody) {
    return request.rawBody;
  }

  if (Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (request.body && typeof request.body === 'object') {
    return Buffer.from(JSON.stringify(request.body), 'utf8');
  }

  throw new Error('Raw body is missing.');
}

@Controller('billing/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('monobank')
  @HttpCode(200)
  async monobankWebhook(
    @Req() request: RequestWithRawBody,
    @Headers('x-sign') xSign = '',
  ) {
    return this.webhooksService.handleMonobankWebhook(
      getRawBody(request),
      xSign,
    );
  }
}

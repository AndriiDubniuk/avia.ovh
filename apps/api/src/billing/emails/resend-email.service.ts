import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class ResendEmailService {
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(input: SendEmailInput) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') ?? '';
    const from = this.configService.get<string>('RESEND_FROM_EMAIL') ?? '';

    if (!apiKey || !from) {
      throw new Error('Resend is not configured.');
    }

    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Resend API call failed.';
      this.logger.error(`Failed to send email via Resend: ${message}`);
      throw error;
    }
  }
}

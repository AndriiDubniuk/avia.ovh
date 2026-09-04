import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { ContactRequest } from '../contact-request.entity';

/**
 * Надсилає заявку з контактної форми на власний поштовий сервер по SMTP.
 *
 * Свідомо окремо від `ResendEmailService`: той обслуговує білінг і лишається
 * без змін. Тут потрібен саме власний сервер, тож спільної абстракції не
 * робимо — вона б лише зв'язала два незалежні канали.
 */
@Injectable()
export class ContactMailService {
  private readonly logger = new Logger(ContactMailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  /** Чи налаштований канал. Без хоста надсилати нікуди. */
  isConfigured() {
    return Boolean(this.configService.get<string>('SMTP_HOST'));
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST') ?? '';
    const port = this.configService.get<number>('SMTP_PORT') ?? 587;
    const secure = this.configService.get<boolean>('SMTP_SECURE') ?? false;
    const user = this.configService.get<string>('SMTP_USER') ?? '';
    const pass = this.configService.get<string>('SMTP_PASSWORD') ?? '';

    this.transporter = createTransport({
      host,
      port,
      // 465 працює по TLS одразу, 587 — через STARTTLS уже після привітання.
      secure,
      // Сервер може приймати пошту без автентифікації (наприклад, у своїй
      // мережі), тому облікові дані передаємо лише коли вони задані.
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    return this.transporter;
  }

  async sendContactRequest(request: ContactRequest) {
    const to = this.configService.get<string>('CONTACT_NOTIFICATION_TO_EMAIL');
    const from = this.configService.get<string>('SMTP_FROM_EMAIL');

    if (!this.isConfigured() || !to || !from) {
      throw new Error('SMTP is not configured.');
    }

    const created = request.createdAt.toISOString();
    const рядки = [
      ['Ім’я', request.name],
      ['Компанія', request.companyName ?? '—'],
      ['Пошта', request.email],
      ['Спосіб звʼязку', request.contact],
      ['Напрямок', request.serviceName],
      ['Отримано', created],
      ['ID заявки', request.id],
    ];

    const text = [
      ...рядки.map(([label, value]) => `${label}: ${value}`),
      '',
      'Повідомлення:',
      request.message,
    ].join('\n');

    const html = [
      '<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">',
      ...рядки.map(
        ([label, value]) =>
          `<tr><td style="color:#666">${escapeHtml(label)}</td><td><b>${escapeHtml(value)}</b></td></tr>`,
      ),
      '</table>',
      `<p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(request.message)}</p>`,
    ].join('');

    await this.getTransporter().sendMail({
      from,
      to,
      // Відповідь із поштової скриньки піде одразу клієнту, а не на From.
      replyTo: request.email,
      subject: `Заявка з сайту: ${request.serviceName} — ${request.name}`,
      text,
      html,
    });

    this.logger.log(`Заявку ${request.id} надіслано на ${to}.`);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

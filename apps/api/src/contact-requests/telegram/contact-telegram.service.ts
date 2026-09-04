import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ContactRequest } from '../contact-request.entity';

/**
 * Дублює заявку з контактної форми в Telegram.
 *
 * Окремий сервіс, а не гілка всередині поштового: канали незалежні, і падіння
 * одного не повинно впливати на інший. Спільної абстракції не робимо —
 * у пошти й Telegram різні обмеження на формат і різні режими помилок.
 */
@Injectable()
export class ContactTelegramService {
  private readonly logger = new Logger(ContactTelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  /** Без токена й адресата надсилати нікуди. */
  isConfigured() {
    return Boolean(this.getToken() && this.getChatIds().length);
  }

  private getToken() {
    return (this.configService.get<string>('TELEGRAM_BOT_TOKEN') ?? '').trim();
  }

  /**
   * Адресатів може бути кілька: id через кому. Це і особисті чати, і групи,
   * і канали у форматі `@name` — Telegram приймає їх однаково.
   */
  private getChatIds() {
    return (this.configService.get<string>('TELEGRAM_CHAT_ID') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  async sendContactRequest(request: ContactRequest) {
    const token = this.getToken();
    const chatIds = this.getChatIds();

    if (!token || !chatIds.length) {
      throw new Error('Telegram is not configured.');
    }

    const text = this.buildMessage(request);

    /* Кожен адресат — окремий виклик. `allSettled`, щоб недоступність одного
       чату не скасовувала доставку в решту. */
    const results = await Promise.allSettled(
      chatIds.map((chatId) =>
        axios.post(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          },
          { timeout: 10000 },
        ),
      ),
    );

    const failed = results.filter((item) => item.status === 'rejected');

    if (failed.length === results.length) {
      const reason: unknown = failed[0].reason;
      const message =
        reason instanceof Error ? reason.message : 'Telegram API call failed.';
      throw new Error(message);
    }

    if (failed.length) {
      this.logger.warn(
        `Заявку ${request.id} доставлено не в усі чати: ${failed.length} з ${results.length} не вдалося.`,
      );
    }

    this.logger.log(
      `Заявку ${request.id} надіслано в Telegram (${results.length - failed.length} чат(ів)).`,
    );
  }

  private buildMessage(request: ContactRequest) {
    const рядки: Array<[string, string]> = [
      ['Імʼя', request.name],
      ['Компанія', request.companyName ?? '—'],
      ['Пошта', request.email],
      ['Звʼязок', request.contact],
      ['Напрямок', request.serviceName],
    ];

    return [
      '<b>Нова заявка з сайту</b>',
      '',
      ...рядки.map(([label, value]) => `${label}: <b>${escapeHtml(value)}</b>`),
      '',
      escapeHtml(request.message),
      '',
      `<i>${request.createdAt.toISOString()} · ${request.id}</i>`,
    ].join('\n');
  }
}

/** Telegram у режимі HTML вимагає екранувати лише ці три символи. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

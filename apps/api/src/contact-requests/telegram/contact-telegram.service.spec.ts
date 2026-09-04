import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ContactRequest } from '../contact-request.entity';
import { ContactTelegramService } from './contact-telegram.service';

/** Тіло, яке сервіс шле в Telegram. */
type SendMessage = {
  chat_id: string;
  text: string;
  parse_mode: string;
};

describe('ContactTelegramService', () => {
  const request = {
    id: 'req-1',
    name: 'Олена <script>',
    companyName: null,
    email: 'olena@example.com',
    contact: '@olena',
    serviceName: 'Лендінг',
    message: 'Треба сайт & швидко',
    createdAt: new Date('2026-08-18T10:00:00.000Z'),
  } as ContactRequest;

  function build(env: Record<string, string>) {
    const configService = {
      get: (key: string) => env[key],
    } as unknown as ConfigService;
    return new ContactTelegramService(configService);
  }

  // `spyOn`, а не відʼєднане посилання на axios.post: так метод лишається
  // звʼязаним зі своїм обʼєктом і типи не втрачаються.
  const post = jest.spyOn(axios, 'post');
  const тіло = (index: number) => post.mock.calls[index][1] as SendMessage;

  beforeEach(() => post.mockReset());
  afterAll(() => post.mockRestore());

  it('вважає канал ненавлаштованим без токена або чату', () => {
    expect(build({}).isConfigured()).toBe(false);
    expect(build({ TELEGRAM_BOT_TOKEN: 't' }).isConfigured()).toBe(false);
    expect(
      build({ TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' }).isConfigured(),
    ).toBe(true);
  });

  it('надсилає в кожен чат зі списку й екранує розмітку', async () => {
    post.mockResolvedValue({ data: { ok: true } });
    const service = build({
      TELEGRAM_BOT_TOKEN: 'secret',
      TELEGRAM_CHAT_ID: '111, @avia_leads',
    });

    await service.sendContactRequest(request);

    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[0][0]).toBe(
      'https://api.telegram.org/botsecret/sendMessage',
    );
    expect(тіло(0).chat_id).toBe('111');
    expect(тіло(1).chat_id).toBe('@avia_leads');

    // Кутові дужки й амперсанд мають бути екрановані, інакше Telegram
    // відхилить повідомлення з parse_mode: HTML.
    expect(тіло(0).text).toContain('&lt;script&gt;');
    expect(тіло(0).text).toContain('&amp;');
  });

  it('не падає, коли недоступний лише один із чатів', async () => {
    post
      .mockRejectedValueOnce(new Error('chat not found'))
      .mockResolvedValueOnce({ data: { ok: true } });

    const service = build({
      TELEGRAM_BOT_TOKEN: 'secret',
      TELEGRAM_CHAT_ID: '111,222',
    });

    await expect(service.sendContactRequest(request)).resolves.toBeUndefined();
  });

  it('кидає помилку, коли не вдалося в жоден чат', async () => {
    post.mockRejectedValue(new Error('unauthorized'));
    const service = build({
      TELEGRAM_BOT_TOKEN: 'secret',
      TELEGRAM_CHAT_ID: '111,222',
    });

    await expect(service.sendContactRequest(request)).rejects.toThrow(
      'unauthorized',
    );
  });
});

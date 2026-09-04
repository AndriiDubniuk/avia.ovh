import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContactRequest } from './contact-request.entity';
import { ContactRequestsService } from './contact-requests.service';
import { ContactMailService } from './mail/contact-mail.service';
import { ContactTelegramService } from './telegram/contact-telegram.service';

describe('ContactRequestsService', () => {
  const dto = {
    name: 'Олена',
    companyName: '  Ромашка  ',
    email: 'olena@example.com',
    contact: '@olena',
    serviceName: 'Сайт компанії',
    message: 'Потрібен сайт до кінця кварталу.',
  };

  const saved = {
    id: 'req-1',
    createdAt: new Date('2026-08-18T10:00:00.000Z'),
  } as ContactRequest;

  function канал(налаштований: boolean, помилка?: string) {
    return {
      isConfigured: () => налаштований,
      sendContactRequest: помилка
        ? jest.fn().mockRejectedValue(new Error(помилка))
        : jest.fn().mockResolvedValue(undefined),
    };
  }

  async function build(
    mail: ReturnType<typeof канал>,
    telegram: ReturnType<typeof канал>,
  ) {
    const repository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockResolvedValue(saved),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactRequestsService,
        { provide: getRepositoryToken(ContactRequest), useValue: repository },
        { provide: ContactMailService, useValue: mail },
        { provide: ContactTelegramService, useValue: telegram },
      ],
    }).compile();

    return { service: moduleRef.get(ContactRequestsService), repository };
  }

  it('надсилає заявку і на пошту, і в Telegram', async () => {
    const mail = канал(true);
    const telegram = канал(true);
    const { service, repository } = await build(mail, telegram);

    const result = await service.create(dto);

    // Порожня назва компанії має ставати null, а не порожнім рядком.
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'Ромашка' }),
    );
    expect(mail.sendContactRequest).toHaveBeenCalledWith(saved);
    expect(telegram.sendContactRequest).toHaveBeenCalledWith(saved);
    expect(result.id).toBe('req-1');
  });

  it('надсилає в Telegram, навіть коли пошта впала', async () => {
    const mail = канал(true, 'SMTP down');
    const telegram = канал(true);
    const { service } = await build(mail, telegram);

    await expect(service.create(dto)).resolves.toMatchObject({ id: 'req-1' });
    expect(telegram.sendContactRequest).toHaveBeenCalled();
  });

  it('надсилає на пошту, навіть коли Telegram впав', async () => {
    const mail = канал(true);
    const telegram = канал(true, 'Telegram 403');
    const { service } = await build(mail, telegram);

    await expect(service.create(dto)).resolves.toMatchObject({ id: 'req-1' });
    expect(mail.sendContactRequest).toHaveBeenCalled();
  });

  it('не втрачає заявку, коли впали обидва канали', async () => {
    const { service, repository } = await build(
      канал(true, 'SMTP down'),
      канал(true, 'Telegram 403'),
    );

    const result = await service.create(dto);

    expect(repository.save).toHaveBeenCalled();
    expect(result.id).toBe('req-1');
  });

  it('зберігає заявку, коли жоден канал не налаштований', async () => {
    const mail = канал(false);
    const telegram = канал(false);
    const { service } = await build(mail, telegram);

    await expect(service.create(dto)).resolves.toMatchObject({ id: 'req-1' });
    expect(mail.sendContactRequest).not.toHaveBeenCalled();
    expect(telegram.sendContactRequest).not.toHaveBeenCalled();
  });
});

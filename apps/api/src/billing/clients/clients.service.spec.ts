import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<Repository<Client>>;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Repository<Client>>;

    service = new ClientsService(repository);
  });

  it('creates a new client when no existing record', async () => {
    const created = {
      id: 'client-1',
      externalRef: 'ext-1',
    } as Client;

    repository.findOne.mockResolvedValue(null);
    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);

    const result = await service.upsertByExternalRef({
      externalRef: 'ext-1',
      name: 'Test',
      email: 'test@example.com',
      phone: '+380',
      timezone: 'Europe/Kyiv',
    });

    expect(repository.create).toHaveBeenCalled();
    expect(result).toBe(created);
  });

  it('updates existing client when found', async () => {
    const existing = {
      id: 'client-1',
      externalRef: 'ext-1',
      name: 'Old',
      email: 'old@example.com',
      phone: null,
      timezone: 'UTC',
    } as Client;

    repository.findOne.mockResolvedValue(existing);
    repository.save.mockImplementation(async (payload) => payload as Client);

    const result = await service.upsertByExternalRef({
      externalRef: 'ext-1',
      name: 'New',
      email: 'new@example.com',
      timezone: 'Europe/Kyiv',
    });

    expect(result.name).toBe('New');
    expect(result.email).toBe('new@example.com');
    expect(result.timezone).toBe('Europe/Kyiv');
  });
});

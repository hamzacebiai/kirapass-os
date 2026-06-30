import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TenantMessagingService } from './tenant-messaging.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const OWNER = 't-owner';
const ATTACKER = 't-attacker';
const THREAD = 'thread-1';

// findFirst resolves a thread ONLY when where.tenantId matches the owner — this
// mirrors the DB's ownership filter, so the test truly exercises tenantId scoping.
const prisma = {
  messageThread: {
    findFirst: jest.fn((args: { where: { id: string; tenantId: string } }) =>
      Promise.resolve(
        args.where.id === THREAD && args.where.tenantId === OWNER
          ? { id: THREAD, tenantId: OWNER, messages: [] }
          : null,
      ),
    ),
    findMany: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  message: {
    create: jest.fn().mockResolvedValue({ id: 'm1' }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
};

describe('TenantMessagingService (isolation)', () => {
  let service: TenantMessagingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TenantMessagingService,
        { provide: TenantPrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(TenantMessagingService);
    jest.clearAllMocks();
  });

  it('happy: owner can read their own thread', async () => {
    await expect(service.getMyThread(THREAD, OWNER)).resolves.toMatchObject({
      id: THREAD,
      tenantId: OWNER,
    });
    // proves the ownership filter was applied
    expect(prisma.messageThread.findFirst.mock.calls[0][0].where).toEqual({
      id: THREAD,
      tenantId: OWNER,
    });
  });

  it('CRITICAL fail: another tenant requesting an existing thread → NotFound (existence hidden)', async () => {
    await expect(service.getMyThread(THREAD, ATTACKER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('happy: owner can post to their own thread', async () => {
    await service.sendMyMessage(THREAD, OWNER, { body: 'merhaba' });
    expect(prisma.message.create).toHaveBeenCalledTimes(1);
    const created = prisma.message.create.mock.calls[0][0].data;
    expect(created.senderRole).toBe('TENANT');
    expect(created.senderId).toBe(OWNER);
  });

  it('CRITICAL fail: attacker cannot post to a thread they do not own → NotFound, no message created', async () => {
    await expect(
      service.sendMyMessage(THREAD, ATTACKER, { body: 'sızıntı denemesi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });
});

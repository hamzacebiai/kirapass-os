import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { AuditService } from '../../common/audit/audit.service';

const prisma = { user: { findMany: jest.fn() } };
const audit = { log: jest.fn() };

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: TenantPrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
    jest.clearAllMocks();
  });

  it('happy: list returns users', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);
    await expect(service.list()).resolves.toHaveLength(1);
  });

  it('edge: list returns empty array when no records', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await expect(service.list()).resolves.toEqual([]);
  });

  it('audit: list emits a tenant.access audit event', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await service.list();
    expect(audit.log).toHaveBeenCalled();
  });
});

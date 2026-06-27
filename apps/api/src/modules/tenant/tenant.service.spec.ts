jest.mock('../../common/request-context', () => ({
  getRequestContext: () => ({ agencyId: 'agency-1', userId: 'user-1', role: 'AGENCY_OWNER' }),
}));

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = { tenant: { findMany: jest.fn(), findFirst: jest.fn() } };

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [TenantService, { provide: TenantPrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(TenantService);
    jest.clearAllMocks();
  });

  it('happy: getById returns owned entity', async () => {
    prisma.tenant.findFirst.mockResolvedValue({ id: 't1', agencyId: 'agency-1' });
    await expect(service.getById('t1')).resolves.toMatchObject({ id: 't1' });
  });

  it('fail: getById throws NotFound when missing', async () => {
    prisma.tenant.findFirst.mockResolvedValue(null);
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('edge: list returns empty array when no records', async () => {
    prisma.tenant.findMany.mockResolvedValue([]);
    await expect(service.list()).resolves.toEqual([]);
  });
});

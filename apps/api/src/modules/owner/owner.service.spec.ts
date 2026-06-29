jest.mock('../../common/request-context', () => ({
  getRequestContext: () => ({
    agencyId: 'agency-1',
    userId: 'u1',
    role: 'AGENCY_OWNER',
  }),
}));

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = { owner: { findMany: jest.fn(), findFirst: jest.fn() } };

describe('OwnerService', () => {
  let service: OwnerService;
  beforeEach(async () => {
    const m = await Test.createTestingModule({
      providers: [OwnerService, { provide: TenantPrismaService, useValue: prisma }],
    }).compile();
    service = m.get(OwnerService);
    jest.clearAllMocks();
  });
  it('happy: getById returns owner', async () => {
    prisma.owner.findFirst.mockResolvedValue({ id: 'o1', agencyId: 'agency-1' });
    await expect(service.getById('o1')).resolves.toMatchObject({ id: 'o1' });
  });
  it('fail: getById throws when missing', async () => {
    prisma.owner.findFirst.mockResolvedValue(null);
    await expect(service.getById('x')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('edge: list returns empty array', async () => {
    prisma.owner.findMany.mockResolvedValue([]);
    await expect(service.list()).resolves.toEqual([]);
  });
});

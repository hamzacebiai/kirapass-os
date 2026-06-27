jest.mock('../../common/request-context', () => ({
  getRequestContext: () => ({ agencyId: 'agency-1', userId: 'user-1', role: 'AGENCY_OWNER' }),
}));

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeaseService } from './lease.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = { lease: { findMany: jest.fn(), findFirst: jest.fn() } };

describe('LeaseService', () => {
  let service: LeaseService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [LeaseService, { provide: TenantPrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(LeaseService);
    jest.clearAllMocks();
  });

  it('happy: getById returns owned entity', async () => {
    prisma.lease.findFirst.mockResolvedValue({ id: 'l1', agencyId: 'agency-1' });
    await expect(service.getById('l1')).resolves.toMatchObject({ id: 'l1' });
  });

  it('fail: getById throws NotFound when missing', async () => {
    prisma.lease.findFirst.mockResolvedValue(null);
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('edge: list returns empty array when no records', async () => {
    prisma.lease.findMany.mockResolvedValue([]);
    await expect(service.list()).resolves.toEqual([]);
  });
});

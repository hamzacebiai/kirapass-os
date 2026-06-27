jest.mock('../../common/request-context', () => ({
  getRequestContext: () => ({ agencyId: 'agency-1', userId: 'user-1', role: 'AGENCY_OWNER' }),
}));

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UnitService } from './unit.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = { unit: { findMany: jest.fn(), findFirst: jest.fn() } };

describe('UnitService', () => {
  let service: UnitService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UnitService, { provide: TenantPrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(UnitService);
    jest.clearAllMocks();
  });

  it('happy: getById returns owned entity', async () => {
    prisma.unit.findFirst.mockResolvedValue({ id: 'u1', agencyId: 'agency-1' });
    await expect(service.getById('u1')).resolves.toMatchObject({ id: 'u1' });
  });

  it('fail: getById throws NotFound when missing', async () => {
    prisma.unit.findFirst.mockResolvedValue(null);
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('edge: list returns empty array when no records', async () => {
    prisma.unit.findMany.mockResolvedValue([]);
    await expect(service.list()).resolves.toEqual([]);
  });
});

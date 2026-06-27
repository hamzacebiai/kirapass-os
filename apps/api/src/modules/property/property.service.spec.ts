jest.mock('../../common/request-context', () => ({
  getRequestContext: () => ({ agencyId: 'agency-1', userId: 'user-1', role: 'AGENCY_OWNER' }),
}));

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PropertyService } from './property.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = { property: { findMany: jest.fn(), findFirst: jest.fn() } };

describe('PropertyService', () => {
  let service: PropertyService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PropertyService, { provide: TenantPrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PropertyService);
    jest.clearAllMocks();
  });

  it('happy: getById returns owned entity', async () => {
    prisma.property.findFirst.mockResolvedValue({ id: 'p1', agencyId: 'agency-1' });
    await expect(service.getById('p1')).resolves.toMatchObject({ id: 'p1' });
  });

  it('fail: getById throws NotFound when missing', async () => {
    prisma.property.findFirst.mockResolvedValue(null);
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('edge: list returns empty array when no records', async () => {
    prisma.property.findMany.mockResolvedValue([]);
    await expect(service.list()).resolves.toEqual([]);
  });
});

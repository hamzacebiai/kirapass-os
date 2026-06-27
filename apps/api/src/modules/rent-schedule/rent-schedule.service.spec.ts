jest.mock('../../common/request-context', () => ({
  getRequestContext: () => ({ agencyId: 'agency-1', userId: 'user-1', role: 'AGENCY_OWNER' }),
}));

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RentScheduleService } from './rent-schedule.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = { rentSchedule: { findMany: jest.fn(), findFirst: jest.fn() } };

describe('RentScheduleService', () => {
  let service: RentScheduleService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [RentScheduleService, { provide: TenantPrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RentScheduleService);
    jest.clearAllMocks();
  });

  it('happy: getById returns owned entity', async () => {
    prisma.rentSchedule.findFirst.mockResolvedValue({ id: 'rs1', agencyId: 'agency-1' });
    await expect(service.getById('rs1')).resolves.toMatchObject({ id: 'rs1' });
  });

  it('fail: getById throws NotFound when missing', async () => {
    prisma.rentSchedule.findFirst.mockResolvedValue(null);
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('edge: list returns empty array when no records', async () => {
    prisma.rentSchedule.findMany.mockResolvedValue([]);
    await expect(service.list()).resolves.toEqual([]);
  });
});

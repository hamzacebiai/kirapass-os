jest.mock('../../common/request-context', () => ({
  getRequestContext: () => ({ agencyId: 'agency-1', userId: 'user-1', role: 'AGENCY_OWNER' }),
}));

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = { payment: { findMany: jest.fn(), findFirst: jest.fn() } };

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PaymentService, { provide: TenantPrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PaymentService);
    jest.clearAllMocks();
  });

  it('happy: getById returns owned entity', async () => {
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay1', agencyId: 'agency-1' });
    await expect(service.getById('pay1')).resolves.toMatchObject({ id: 'pay1' });
  });

  it('fail: getById throws NotFound when missing', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('edge: list returns empty array when no records', async () => {
    prisma.payment.findMany.mockResolvedValue([]);
    await expect(service.list()).resolves.toEqual([]);
  });
});

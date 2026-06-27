import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = {
  property: { count: jest.fn() },
  unit: { count: jest.fn() },
  tenant: { count: jest.fn() },
  lease: { count: jest.fn() },
  rentSchedule: { aggregate: jest.fn(), count: jest.fn() },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DashboardService, { provide: TenantPrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(DashboardService);
    jest.clearAllMocks();
  });

  it('happy: returns full summary object', async () => {
    prisma.property.count.mockResolvedValue(3);
    prisma.unit.count.mockResolvedValue(10);
    prisma.tenant.count.mockResolvedValue(5);
    prisma.lease.count.mockResolvedValue(4);
    prisma.rentSchedule.aggregate.mockResolvedValue({ _sum: { amount: 12000 } });
    // 1. çağrı = pending, 2. çağrı = overdue
    prisma.rentSchedule.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    const result = await service.getSummary();
    expect(result.agency.propertyCount).toBe(3);
    expect(result.agency.activeLeaseCount).toBe(4);
    expect(result.financial.monthlyRentTotal).toBe(12000);
    expect(result.financial.pendingCount).toBe(2);
    expect(result.financial.overdueCount).toBe(1);
    expect(result.generatedAt).toBeDefined();
  });

  it('edge: null amount aggregate → returns 0', async () => {
    prisma.property.count.mockResolvedValue(0);
    prisma.unit.count.mockResolvedValue(0);
    prisma.tenant.count.mockResolvedValue(0);
    prisma.lease.count.mockResolvedValue(0);
    prisma.rentSchedule.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.rentSchedule.count.mockResolvedValue(0);

    const result = await service.getSummary();
    expect(result.financial.monthlyRentTotal).toBe(0);
  });

  it('fail: propagates prisma error', async () => {
    prisma.property.count.mockRejectedValue(new Error('DB error'));
    await expect(service.getSummary()).rejects.toThrow('DB error');
  });
});

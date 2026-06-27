import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // Read-only, agency-scoped (tenant middleware count/aggregate'i otomatik scope eder).
  async getSummary(): Promise<DashboardSummaryDto> {
    const [
      propertyCount,
      unitCount,
      tenantCount,
      activeLeaseCount,
      rentAgg,
      pendingCount,
      overdueCount,
    ] = await Promise.all([
      this.prisma.property.count({ where: { status: { not: 'ARCHIVED' as const } } }),
      this.prisma.unit.count({ where: { status: { not: 'ARCHIVED' as const } } }),
      this.prisma.tenant.count({ where: { status: { not: 'ARCHIVED' as const } } }),
      this.prisma.lease.count({ where: { status: 'ACTIVE' as const } }),
      this.prisma.rentSchedule.aggregate({
        _sum: { amount: true },
        where: { status: { not: 'CANCELLED' as const } },
      }),
      this.prisma.rentSchedule.count({ where: { status: 'PENDING' as const } }),
      // Overdue: vadesi geçmiş ve hâlâ PENDING.
      this.prisma.rentSchedule.count({
        where: { status: 'PENDING' as const, dueDate: { lt: new Date() } },
      }),
    ]);

    return {
      agency: { propertyCount, unitCount, tenantCount, activeLeaseCount },
      financial: {
        // RentSchedule.amount Decimal'dir → number'a çevir.
        monthlyRentTotal: Number(rentAgg._sum.amount ?? 0),
        pendingCount,
        overdueCount,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

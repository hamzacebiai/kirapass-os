import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // Read-only, agency-scoped (tenant middleware count/aggregate'i otomatik scope eder).
  async getSummary(): Promise<DashboardSummaryDto> {
    const [propertyCount, unitCount, tenantCount, activeLeaseCount, rentAgg, pendingCount] =
      await Promise.all([
        this.prisma.property.count({ where: { status: { not: 'ARCHIVED' as const } } }),
        this.prisma.unit.count({ where: { status: { not: 'ARCHIVED' as const } } }),
        this.prisma.tenant.count({ where: { status: { not: 'ARCHIVED' as const } } }),
        this.prisma.lease.count({ where: { status: 'ACTIVE' as const } }),
        this.prisma.rentSchedule.aggregate({
          _sum: { amount: true },
          where: { status: { not: 'CANCELLED' as const } },
        }),
        this.prisma.rentSchedule.count({ where: { status: 'PENDING' as const } }),
      ]);

    return {
      agency: { propertyCount, unitCount, tenantCount, activeLeaseCount },
      financial: {
        // RentSchedule.amount Decimal'dir → number'a çevir.
        monthlyRentTotal: Number(rentAgg._sum.amount ?? 0),
        pendingCount,
        // ASSUMPTION: ayrı OVERDUE durumu yok; finansal reconciliation (Ledger) işi.
        overdueCount: 0,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

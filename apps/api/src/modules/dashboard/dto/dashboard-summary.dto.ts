export class AgencySummaryDto {
  propertyCount: number;
  unitCount: number;
  tenantCount: number;
  activeLeaseCount: number;
}

export class FinancialSummaryDto {
  monthlyRentTotal: number;
  pendingCount: number;
  overdueCount: number;
}

export class DashboardSummaryDto {
  agency: AgencySummaryDto;
  financial: FinancialSummaryDto;
  generatedAt: string;
}

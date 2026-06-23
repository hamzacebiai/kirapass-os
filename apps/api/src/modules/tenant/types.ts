import type { TenantStatus } from "./domain/value-objects.js";

/** Inbound shape for registering a tenant (mapped from request body). */
export interface RegisterTenantInput {
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  accountId?: string;
}

/** Outbound read view of a Tenant (API response shape). */
export interface TenantView {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  status: TenantStatus;
  accountId: string | null;
  ratingSummary: number | null;
}

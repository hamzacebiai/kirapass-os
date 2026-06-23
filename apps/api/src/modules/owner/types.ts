import type { OwnerStatus } from "./domain/value-objects.js";

/** Inbound shape for registering an owner (mapped from request body). */
export interface RegisterOwnerInput {
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  payoutIban?: string;
  accountId?: string;
  partnerId?: string;
}

/** Outbound read view of an Owner (API response shape). */
export interface OwnerView {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  payoutIban: string | null;
  status: OwnerStatus;
  accountId: string | null;
  partnerId: string | null;
}

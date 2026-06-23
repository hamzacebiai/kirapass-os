import type { PartnerStatus } from "./domain/value-objects.js";

/** Inbound shape for onboarding a partner (mapped from request body). */
export interface OnboardPartnerInput {
  name: string;
  email: string;
  phone: string;
  accountId?: string;
}

/** Outbound read view of a Partner (API response shape). */
export interface PartnerView {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: PartnerStatus;
  accountId: string | null;
  managedOwnerIds: string[];
}

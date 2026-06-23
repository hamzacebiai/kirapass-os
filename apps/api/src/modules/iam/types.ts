import type { Role } from "./domain/value-objects.js";

/** Inbound shape for inviting an account (mapped from request body). */
export interface InviteAccountInput {
  email: string;
  role: string;
  partyId?: string;
}

/** Outbound read view of an Account (API response shape). */
export interface AccountView {
  id: string;
  email: string;
  role: Role;
  status: string;
  partyId: string | null;
}

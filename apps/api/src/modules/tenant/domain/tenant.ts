import { IllegalTransitionError } from "./errors.js";
import {
  canActivate,
  canArchive,
  canMarkPast,
  canVerify,
} from "./specifications.js";
import type {
  EmailAddress,
  NationalId,
  PhoneNumber,
  TenantId,
  TenantStatus,
} from "./value-objects.js";

/**
 * Tenant aggregate root (Party context).
 *
 * Immutable: every transition returns a new frozen Tenant. Sole owner of its
 * lifecycle invariants (Registered → Verified → Active → Past → Archived).
 *
 * Blueprint alignment (DOMAIN_BLUEPRINT §3, §4, §16):
 * - NO embedded per-lease rating — that lives in the Reputation context as
 *   TenantRating (step 13). `ratingSummary` here is a DERIVED, read-only value
 *   fed by a future `TenantRatingSummaryRecomputed` handler; null until then.
 *   It is never settable via the API.
 * - Identity verification is referenced, not owned: the `verify` transition is
 *   a lifecycle state today; real VerificationResult linkage arrives with the
 *   Verification context (step 5).
 * - `accountId` is an id-only reference (no foreign aggregate). Cross-context
 *   "cannot Archive while holding an Active Lease / unsettled dues" guard is
 *   deferred to an ArchivalGuardPolicy once Lease/Billing exist.
 */
export interface Tenant {
  readonly id: TenantId;
  readonly fullName: string;
  readonly nationalId: NationalId;
  readonly phone: PhoneNumber;
  readonly email: EmailAddress;
  readonly status: TenantStatus;
  readonly accountId: string | null;
  readonly ratingSummary: number | null;
}

export interface RegisterTenantProps {
  id: TenantId;
  fullName: string;
  nationalId: NationalId;
  phone: PhoneNumber;
  email: EmailAddress;
  accountId?: string | null;
}

export function registerTenant(props: RegisterTenantProps): Tenant {
  const tenant: Tenant = {
    id: props.id,
    fullName: props.fullName,
    nationalId: props.nationalId,
    phone: props.phone,
    email: props.email,
    status: "Registered",
    accountId: props.accountId ?? null,
    ratingSummary: null,
  };
  return Object.freeze(tenant);
}

export function verify(tenant: Tenant): Tenant {
  if (!canVerify(tenant)) {
    throw new IllegalTransitionError(
      `Cannot verify a tenant in status ${tenant.status}`,
    );
  }
  const next: Tenant = { ...tenant, status: "Verified" };
  return Object.freeze(next);
}

export function activate(tenant: Tenant): Tenant {
  if (!canActivate(tenant)) {
    throw new IllegalTransitionError(
      `Cannot activate a tenant in status ${tenant.status}`,
    );
  }
  const next: Tenant = { ...tenant, status: "Active" };
  return Object.freeze(next);
}

export function markPast(tenant: Tenant): Tenant {
  if (!canMarkPast(tenant)) {
    throw new IllegalTransitionError(
      `Cannot mark a tenant in status ${tenant.status} as past`,
    );
  }
  const next: Tenant = { ...tenant, status: "Past" };
  return Object.freeze(next);
}

export function archive(tenant: Tenant): Tenant {
  if (!canArchive(tenant)) {
    throw new IllegalTransitionError(
      `Cannot archive a tenant in status ${tenant.status}`,
    );
  }
  const next: Tenant = { ...tenant, status: "Archived" };
  return Object.freeze(next);
}

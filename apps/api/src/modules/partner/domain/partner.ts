import { IllegalTransitionError } from "./errors.js";
import {
  canActivate,
  canArchive,
  canManageStewardship,
  canSuspend,
} from "./specifications.js";
import type {
  EmailAddress,
  PartnerId,
  PartnerStatus,
  PhoneNumber,
} from "./value-objects.js";

/**
 * Partner aggregate root (Party context).
 *
 * Immutable: every transition returns a new frozen Partner (and a frozen
 * managed-owner list). Sole owner of its lifecycle invariants (Onboarded →
 * Active → Suspended → Archived) and of its stewardship set. `managedOwnerIds`
 * and `accountId` are id-only references to other contexts (no foreign
 * aggregate).
 *
 * Deferred (cross-aggregate, DOMAIN_BLUEPRINT §4): "cannot Suspend/Archive while
 * stewarding a Property under an Active Lease" — enforced by a
 * StewardshipReassignmentPolicy once Property/Lease exist (steps 6/9).
 */
export interface Partner {
  readonly id: PartnerId;
  readonly name: string;
  readonly email: EmailAddress;
  readonly phone: PhoneNumber;
  readonly status: PartnerStatus;
  readonly accountId: string | null;
  readonly managedOwnerIds: readonly string[];
}

export interface OnboardPartnerProps {
  id: PartnerId;
  name: string;
  email: EmailAddress;
  phone: PhoneNumber;
  accountId?: string | null;
}

export function onboardPartner(props: OnboardPartnerProps): Partner {
  const partner: Partner = {
    id: props.id,
    name: props.name,
    email: props.email,
    phone: props.phone,
    status: "Onboarded",
    accountId: props.accountId ?? null,
    managedOwnerIds: Object.freeze([]),
  };
  return Object.freeze(partner);
}

export function activate(partner: Partner): Partner {
  if (!canActivate(partner)) {
    throw new IllegalTransitionError(
      `Cannot activate a partner in status ${partner.status}`,
    );
  }
  const next: Partner = { ...partner, status: "Active" };
  return Object.freeze(next);
}

export function suspend(partner: Partner): Partner {
  if (!canSuspend(partner)) {
    throw new IllegalTransitionError(
      `Cannot suspend a partner in status ${partner.status}`,
    );
  }
  const next: Partner = { ...partner, status: "Suspended" };
  return Object.freeze(next);
}

export function archive(partner: Partner): Partner {
  if (!canArchive(partner)) {
    throw new IllegalTransitionError(
      `Cannot archive a partner in status ${partner.status}`,
    );
  }
  const next: Partner = { ...partner, status: "Archived" };
  return Object.freeze(next);
}

export function assignOwnerStewardship(
  partner: Partner,
  ownerId: string,
): Partner {
  if (!canManageStewardship(partner)) {
    throw new IllegalTransitionError(
      `Cannot manage stewardship on a ${partner.status} partner`,
    );
  }
  if (partner.managedOwnerIds.includes(ownerId)) {
    return partner;
  }
  const next: Partner = {
    ...partner,
    managedOwnerIds: Object.freeze([...partner.managedOwnerIds, ownerId]),
  };
  return Object.freeze(next);
}

export function revokeOwnerStewardship(
  partner: Partner,
  ownerId: string,
): Partner {
  if (!canManageStewardship(partner)) {
    throw new IllegalTransitionError(
      `Cannot manage stewardship on a ${partner.status} partner`,
    );
  }
  if (!partner.managedOwnerIds.includes(ownerId)) {
    return partner;
  }
  const next: Partner = {
    ...partner,
    managedOwnerIds: Object.freeze(
      partner.managedOwnerIds.filter((id) => id !== ownerId),
    ),
  };
  return Object.freeze(next);
}

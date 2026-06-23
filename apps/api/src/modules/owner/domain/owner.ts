import { IllegalTransitionError } from "./errors.js";
import {
  canArchive,
  canSetPayoutIban,
  canVerify,
} from "./specifications.js";
import type {
  EmailAddress,
  Iban,
  NationalId,
  OwnerId,
  OwnerStatus,
  PhoneNumber,
} from "./value-objects.js";

/**
 * Owner aggregate root (Party context).
 *
 * Immutable: every transition returns a new frozen Owner. Sole owner of its
 * lifecycle invariants (Registered → Verified → Active → Archived) and of the
 * payout-IBAN-before-Active rule (DOMAIN_BLUEPRINT §4, §8). `accountId` and
 * `partnerId` are id-only references to other contexts (no foreign aggregate).
 * Id generation lives outside the aggregate (infrastructure).
 *
 * Deferred (cross-aggregate): "cannot Archive while holding an Active Lease" —
 * enforced by an ArchivalGuardPolicy once the Lease context exists (step 9).
 */
export interface Owner {
  readonly id: OwnerId;
  readonly fullName: string;
  readonly nationalId: NationalId;
  readonly phone: PhoneNumber;
  readonly email: EmailAddress;
  readonly payoutIban: Iban | null;
  readonly status: OwnerStatus;
  readonly accountId: string | null;
  readonly partnerId: string | null;
}

export interface RegisterOwnerProps {
  id: OwnerId;
  fullName: string;
  nationalId: NationalId;
  phone: PhoneNumber;
  email: EmailAddress;
  payoutIban?: Iban | null;
  accountId?: string | null;
  partnerId?: string | null;
}

export function registerOwner(props: RegisterOwnerProps): Owner {
  const owner: Owner = {
    id: props.id,
    fullName: props.fullName,
    nationalId: props.nationalId,
    phone: props.phone,
    email: props.email,
    payoutIban: props.payoutIban ?? null,
    status: "Registered",
    accountId: props.accountId ?? null,
    partnerId: props.partnerId ?? null,
  };
  return Object.freeze(owner);
}

export function verify(owner: Owner): Owner {
  if (!canVerify(owner)) {
    throw new IllegalTransitionError(
      `Cannot verify an owner in status ${owner.status}`,
    );
  }
  const next: Owner = { ...owner, status: "Verified" };
  return Object.freeze(next);
}

export function setPayoutIban(owner: Owner, iban: Iban): Owner {
  if (!canSetPayoutIban(owner)) {
    throw new IllegalTransitionError(
      `Cannot set payout IBAN on a ${owner.status} owner`,
    );
  }
  const next: Owner = { ...owner, payoutIban: iban };
  return Object.freeze(next);
}

export function activate(owner: Owner): Owner {
  if (owner.status !== "Verified") {
    throw new IllegalTransitionError(
      `Cannot activate an owner in status ${owner.status}`,
    );
  }
  if (owner.payoutIban === null) {
    throw new IllegalTransitionError(
      "Cannot activate an owner without a payout IBAN",
    );
  }
  const next: Owner = { ...owner, status: "Active" };
  return Object.freeze(next);
}

export function archive(owner: Owner): Owner {
  if (!canArchive(owner)) {
    throw new IllegalTransitionError(
      `Cannot archive an owner in status ${owner.status}`,
    );
  }
  const next: Owner = { ...owner, status: "Archived" };
  return Object.freeze(next);
}

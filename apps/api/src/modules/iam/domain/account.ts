import { IllegalTransitionError } from "./errors.js";
import {
  canActivate,
  canAssignRole,
  canClose,
  canSuspend,
} from "./specifications.js";
import type {
  AccountId,
  AccountStatus,
  EmailAddress,
  Role,
} from "./value-objects.js";

/**
 * Account aggregate root (IAM).
 *
 * Immutable: every transition returns a new frozen Account. The aggregate is
 * the sole owner of its lifecycle invariants (Invited → Active → Suspended →
 * Closed); transitions delegate the predicate to Specifications and throw on
 * violation. No other aggregate may mutate this state. Id generation lives
 * outside the aggregate (infrastructure), so the aggregate stays deterministic.
 */
export interface Account {
  readonly id: AccountId;
  readonly email: EmailAddress;
  readonly role: Role;
  readonly status: AccountStatus;
  readonly partyId?: string;
}

export interface InviteAccountProps {
  id: AccountId;
  email: EmailAddress;
  role: Role;
  partyId?: string;
}

export function inviteAccount(props: InviteAccountProps): Account {
  const account: Account = {
    id: props.id,
    email: props.email,
    role: props.role,
    status: "Invited",
    partyId: props.partyId,
  };
  return Object.freeze(account);
}

export function activate(account: Account): Account {
  if (!canActivate(account)) {
    throw new IllegalTransitionError(
      `Cannot activate an account in status ${account.status}`,
    );
  }
  const next: Account = { ...account, status: "Active" };
  return Object.freeze(next);
}

export function suspend(account: Account): Account {
  if (!canSuspend(account)) {
    throw new IllegalTransitionError(
      `Cannot suspend an account in status ${account.status}`,
    );
  }
  const next: Account = { ...account, status: "Suspended" };
  return Object.freeze(next);
}

export function close(account: Account): Account {
  if (!canClose(account)) {
    throw new IllegalTransitionError(
      `Cannot close an account in status ${account.status}`,
    );
  }
  const next: Account = { ...account, status: "Closed" };
  return Object.freeze(next);
}

export function assignRole(account: Account, role: Role): Account {
  if (!canAssignRole(account)) {
    throw new IllegalTransitionError(
      `Cannot assign a role to a ${account.status} account`,
    );
  }
  const next: Account = { ...account, role };
  return Object.freeze(next);
}

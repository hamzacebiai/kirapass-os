import { randomUUID } from "node:crypto";

import {
  activate,
  assignRole as assignAccountRole,
  close,
  inviteAccount as createAccount,
  suspend,
} from "./domain/account.js";
import type { Account } from "./domain/account.js";
import { NotFoundError } from "./domain/errors.js";
import {
  makeAccountId,
  makeEmailAddress,
  makeRole,
} from "./domain/value-objects.js";
import { accountRepository } from "./repository.js";
import type { AccountView, InviteAccountInput } from "./types.js";

/**
 * IAM application service — orchestrates the Account aggregate and its
 * repository per use case. No business rules here: invariants live in the
 * aggregate, validation in the Value Objects. Id generation (infrastructure)
 * happens here, never inside the aggregate.
 */
function toView(account: Account): AccountView {
  return {
    id: account.id,
    email: account.email,
    role: account.role,
    status: account.status,
    partyId: account.partyId ?? null,
  };
}

function loadOrThrow(id: string): Account {
  const account = accountRepository.findById(makeAccountId(id));
  if (!account) {
    throw new NotFoundError(`Account ${id} not found`);
  }
  return account;
}

export function inviteAccount(input: InviteAccountInput): AccountView {
  const account = createAccount({
    id: makeAccountId(randomUUID()),
    email: makeEmailAddress(input.email),
    role: makeRole(input.role),
    partyId: input.partyId,
  });
  return toView(accountRepository.save(account));
}

export function getAccount(id: string): AccountView | null {
  const account = accountRepository.findById(makeAccountId(id));
  return account ? toView(account) : null;
}

export function listAccounts(): readonly AccountView[] {
  return accountRepository.findAll().map(toView);
}

export function activateAccount(id: string): AccountView {
  return toView(accountRepository.save(activate(loadOrThrow(id))));
}

export function suspendAccount(id: string): AccountView {
  return toView(accountRepository.save(suspend(loadOrThrow(id))));
}

export function closeAccount(id: string): AccountView {
  return toView(accountRepository.save(close(loadOrThrow(id))));
}

export function assignRole(id: string, role: string): AccountView {
  return toView(
    accountRepository.save(assignAccountRole(loadOrThrow(id), makeRole(role))),
  );
}

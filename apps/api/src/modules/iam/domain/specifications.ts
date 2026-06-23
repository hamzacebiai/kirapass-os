import type { Account } from "./account.js";

/**
 * IAM Specifications — pure TRUE/FALSE predicates over Account state. No
 * mutation. They encapsulate the lifecycle invariants the aggregate enforces.
 */
export function canActivate(account: Account): boolean {
  return account.status === "Invited";
}

export function canSuspend(account: Account): boolean {
  return account.status === "Active";
}

export function canClose(account: Account): boolean {
  return account.status !== "Closed";
}

export function canAssignRole(account: Account): boolean {
  return account.status !== "Closed";
}

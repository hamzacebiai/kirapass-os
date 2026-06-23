import type { Owner } from "./owner.js";

/**
 * Owner Specifications — pure TRUE/FALSE predicates over Owner state. No
 * mutation. They encapsulate the lifecycle invariants the aggregate enforces.
 */
export function canVerify(owner: Owner): boolean {
  return owner.status === "Registered";
}

export function canActivate(owner: Owner): boolean {
  return owner.status === "Verified" && owner.payoutIban !== null;
}

export function canArchive(owner: Owner): boolean {
  return owner.status !== "Archived";
}

export function canSetPayoutIban(owner: Owner): boolean {
  return owner.status !== "Archived";
}

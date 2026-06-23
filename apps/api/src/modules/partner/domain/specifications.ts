import type { Partner } from "./partner.js";

/**
 * Partner Specifications — pure TRUE/FALSE predicates over Partner state. No
 * mutation. They encapsulate the lifecycle invariants the aggregate enforces.
 */
export function canActivate(partner: Partner): boolean {
  return partner.status === "Onboarded" || partner.status === "Suspended";
}

export function canSuspend(partner: Partner): boolean {
  return partner.status === "Active";
}

export function canArchive(partner: Partner): boolean {
  return partner.status !== "Archived";
}

export function canManageStewardship(partner: Partner): boolean {
  return partner.status !== "Archived";
}

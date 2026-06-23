import type { Tenant } from "./tenant.js";

/**
 * Tenant Specifications — pure TRUE/FALSE predicates over Tenant state. No
 * mutation. They encapsulate the lifecycle invariants the aggregate enforces.
 */
export function canVerify(tenant: Tenant): boolean {
  return tenant.status === "Registered";
}

export function canActivate(tenant: Tenant): boolean {
  return tenant.status === "Verified";
}

export function canMarkPast(tenant: Tenant): boolean {
  return tenant.status === "Active";
}

export function canArchive(tenant: Tenant): boolean {
  return tenant.status !== "Archived";
}

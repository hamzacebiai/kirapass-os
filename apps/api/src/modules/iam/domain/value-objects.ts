import { ValidationError } from "./errors.js";

/**
 * IAM Value Objects — remove primitive obsession at aggregate boundaries
 * (DOMAIN_BLUEPRINT §11). Branded types + validating constructors.
 */
export type AccountId = string & { readonly __brand: "AccountId" };
export type EmailAddress = string & { readonly __brand: "EmailAddress" };

/** Account lifecycle states (DOMAIN_BLUEPRINT §3). */
export type AccountStatus = "Invited" | "Active" | "Suspended" | "Closed";

/** System roles (DOMAIN_BLUEPRINT §7 Authorization Matrix). */
export type Role =
  | "PlatformAdmin"
  | "Partner"
  | "PropertyOwner"
  | "Tenant"
  | "Support";

export const ROLES: readonly Role[] = [
  "PlatformAdmin",
  "Partner",
  "PropertyOwner",
  "Tenant",
  "Support",
];

export function makeAccountId(value: string): AccountId {
  if (value.trim() === "") {
    throw new ValidationError("AccountId must not be empty");
  }
  return value as AccountId;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function makeEmailAddress(value: string): EmailAddress {
  if (!EMAIL_PATTERN.test(value)) {
    throw new ValidationError(`Invalid email address: "${value}"`);
  }
  return value.toLowerCase() as EmailAddress;
}

export function makeRole(value: string): Role {
  if (!ROLES.includes(value as Role)) {
    throw new ValidationError(`Invalid role: "${value}"`);
  }
  return value as Role;
}

import { ValidationError } from "./errors.js";

/**
 * Tenant Value Objects — remove primitive obsession at aggregate boundaries
 * (DOMAIN_BLUEPRINT §11). Branded types + validating constructors.
 */
export type TenantId = string & { readonly __brand: "TenantId" };
export type NationalId = string & { readonly __brand: "NationalId" };
export type PhoneNumber = string & { readonly __brand: "PhoneNumber" };
export type EmailAddress = string & { readonly __brand: "EmailAddress" };

/** Tenant lifecycle states (DOMAIN_BLUEPRINT §8). */
export type TenantStatus =
  | "Registered"
  | "Verified"
  | "Active"
  | "Past"
  | "Archived";

export function makeTenantId(value: string): TenantId {
  if (value.trim() === "") {
    throw new ValidationError("TenantId must not be empty");
  }
  return value as TenantId;
}

const NATIONAL_ID_PATTERN = /^\d{11}$/;

export function makeNationalId(value: string): NationalId {
  if (!NATIONAL_ID_PATTERN.test(value)) {
    throw new ValidationError("NationalId (TCKN) must be 11 digits");
  }
  return value as NationalId;
}

const PHONE_PATTERN = /^\+?\d{7,15}$/;

export function makePhoneNumber(value: string): PhoneNumber {
  const normalized = value.replace(/[\s-]/g, "");
  if (!PHONE_PATTERN.test(normalized)) {
    throw new ValidationError(`Invalid phone number: "${value}"`);
  }
  return normalized as PhoneNumber;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function makeEmailAddress(value: string): EmailAddress {
  if (!EMAIL_PATTERN.test(value)) {
    throw new ValidationError(`Invalid email address: "${value}"`);
  }
  return value.toLowerCase() as EmailAddress;
}

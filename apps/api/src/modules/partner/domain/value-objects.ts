import { ValidationError } from "./errors.js";

/**
 * Partner Value Objects — remove primitive obsession at aggregate boundaries
 * (DOMAIN_BLUEPRINT §11). Branded types + validating constructors. Local by
 * design (no shared kernel yet).
 */
export type PartnerId = string & { readonly __brand: "PartnerId" };
export type EmailAddress = string & { readonly __brand: "EmailAddress" };
export type PhoneNumber = string & { readonly __brand: "PhoneNumber" };

/** Partner lifecycle states (DOMAIN_BLUEPRINT §3). */
export type PartnerStatus = "Onboarded" | "Active" | "Suspended" | "Archived";

export function makePartnerId(value: string): PartnerId {
  if (value.trim() === "") {
    throw new ValidationError("PartnerId must not be empty");
  }
  return value as PartnerId;
}

export function makeOwnerRef(value: string): string {
  if (value.trim() === "") {
    throw new ValidationError("ownerId reference must not be empty");
  }
  return value;
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

import { ValidationError } from "./errors.js";

/**
 * Owner Value Objects — remove primitive obsession at aggregate boundaries
 * (DOMAIN_BLUEPRINT §11). Branded types + validating constructors.
 */
export type OwnerId = string & { readonly __brand: "OwnerId" };
export type NationalId = string & { readonly __brand: "NationalId" };
export type PhoneNumber = string & { readonly __brand: "PhoneNumber" };
export type EmailAddress = string & { readonly __brand: "EmailAddress" };
export type Iban = string & { readonly __brand: "Iban" };

/** Owner lifecycle states (DOMAIN_BLUEPRINT §8). */
export type OwnerStatus = "Registered" | "Verified" | "Active" | "Archived";

export function makeOwnerId(value: string): OwnerId {
  if (value.trim() === "") {
    throw new ValidationError("OwnerId must not be empty");
  }
  return value as OwnerId;
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

const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

export function makeIban(value: string): Iban {
  const normalized = value.replace(/\s/g, "").toUpperCase();
  if (!IBAN_PATTERN.test(normalized)) {
    throw new ValidationError(`Invalid IBAN: "${value}"`);
  }
  return normalized as Iban;
}

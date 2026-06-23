import { ValidationError } from "./errors.js";

/**
 * Verification Value Objects — DOMAIN_BLUEPRINT §11. Branded ids, lifecycle
 * states, and the immutable result shapes. Local by design (no shared kernel).
 */
export type IdentityVerificationId = string & {
  readonly __brand: "IdentityVerificationId";
};
export type PhotoVerificationId = string & {
  readonly __brand: "PhotoVerificationId";
};
export type IsoTimestamp = string & { readonly __brand: "IsoTimestamp" };

/** Identity verification lifecycle (DOMAIN_BLUEPRINT §3, §8). */
export type IdentityVerificationStatus =
  | "Initiated"
  | "InProgress"
  | "Verified"
  | "Failed"
  | "Expired";

/** Photo verification lifecycle (DOMAIN_BLUEPRINT §3, §8). */
export type PhotoVerificationStatus =
  | "Submitted"
  | "UnderReview"
  | "Approved"
  | "Rejected";

/** What a photo verification proves. */
export type PhotoSubjectType = "Property" | "Tenant";

export type IdentityOutcome = "Verified" | "Failed";
export type PhotoOutcome = "Approved" | "Rejected";

/** Immutable identity result (VerificationResult VO, §11). */
export interface VerificationResult {
  readonly outcome: IdentityOutcome;
  readonly issuedAt: IsoTimestamp;
  readonly expiresAt: IsoTimestamp | null;
}

/** Immutable photo decision. */
export interface PhotoResult {
  readonly outcome: PhotoOutcome;
  readonly decidedAt: IsoTimestamp;
}

export function makeIdentityVerificationId(
  value: string,
): IdentityVerificationId {
  if (value.trim() === "") {
    throw new ValidationError("IdentityVerificationId must not be empty");
  }
  return value as IdentityVerificationId;
}

export function makePhotoVerificationId(value: string): PhotoVerificationId {
  if (value.trim() === "") {
    throw new ValidationError("PhotoVerificationId must not be empty");
  }
  return value as PhotoVerificationId;
}

export function makePartyRef(value: string): string {
  if (value.trim() === "") {
    throw new ValidationError("partyId reference must not be empty");
  }
  return value;
}

export function makeSubjectRef(value: string): string {
  if (value.trim() === "") {
    throw new ValidationError("subjectId reference must not be empty");
  }
  return value;
}

export function makeSubjectType(value: string): PhotoSubjectType {
  if (value !== "Property" && value !== "Tenant") {
    throw new ValidationError(`Invalid subjectType: "${value}"`);
  }
  return value;
}

export function makeIsoTimestamp(value: string): IsoTimestamp {
  if (value.trim() === "" || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`Invalid ISO timestamp: "${value}"`);
  }
  return value as IsoTimestamp;
}

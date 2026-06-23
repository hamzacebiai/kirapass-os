import type { IdentityVerification } from "./identity-verification.js";
import type { PhotoVerification } from "./photo-verification.js";

/**
 * Verification Specifications — pure TRUE/FALSE predicates. No mutation. They
 * encapsulate the lifecycle invariants the aggregates enforce.
 */
export function canStartIdentity(iv: IdentityVerification): boolean {
  return iv.status === "Initiated";
}

export function canCompleteIdentity(iv: IdentityVerification): boolean {
  return iv.status === "InProgress";
}

export function canExpireIdentity(iv: IdentityVerification): boolean {
  return iv.status === "Verified";
}

export function canRetryIdentity(iv: IdentityVerification): boolean {
  return iv.status === "Failed";
}

export function canReviewPhoto(pv: PhotoVerification): boolean {
  return pv.status === "Submitted";
}

export function canDecidePhoto(pv: PhotoVerification): boolean {
  return pv.status === "UnderReview";
}

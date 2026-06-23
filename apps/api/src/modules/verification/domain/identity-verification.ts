import { IllegalTransitionError } from "./errors.js";
import {
  canCompleteIdentity,
  canExpireIdentity,
  canRetryIdentity,
  canStartIdentity,
} from "./specifications.js";
import type {
  IdentityVerificationId,
  IdentityVerificationStatus,
  IsoTimestamp,
  VerificationResult,
} from "./value-objects.js";

/**
 * IdentityVerification aggregate root (Verification context).
 *
 * Immutable: every transition returns a new frozen aggregate. Owns its
 * lifecycle invariants (Initiated → InProgress → Verified | Failed | Expired)
 * and the rule that a Verified result is immutable (only system expiry may
 * follow). `partyId` is an id-only reference (no foreign aggregate). Timestamps
 * are injected (no ambient clock in the domain).
 */
export interface IdentityVerification {
  readonly id: IdentityVerificationId;
  readonly partyId: string;
  readonly status: IdentityVerificationStatus;
  readonly result: VerificationResult | null;
}

export interface InitiateIdentityProps {
  id: IdentityVerificationId;
  partyId: string;
}

export function initiate(
  props: InitiateIdentityProps,
): IdentityVerification {
  const iv: IdentityVerification = {
    id: props.id,
    partyId: props.partyId,
    status: "Initiated",
    result: null,
  };
  return Object.freeze(iv);
}

export function start(iv: IdentityVerification): IdentityVerification {
  if (!canStartIdentity(iv)) {
    throw new IllegalTransitionError(
      `Cannot start an identity verification in status ${iv.status}`,
    );
  }
  const next: IdentityVerification = { ...iv, status: "InProgress" };
  return Object.freeze(next);
}

export function markVerified(
  iv: IdentityVerification,
  issuedAt: IsoTimestamp,
  expiresAt: IsoTimestamp | null,
): IdentityVerification {
  if (!canCompleteIdentity(iv)) {
    throw new IllegalTransitionError(
      `Cannot verify an identity verification in status ${iv.status}`,
    );
  }
  const result: VerificationResult = Object.freeze({
    outcome: "Verified",
    issuedAt,
    expiresAt,
  });
  const next: IdentityVerification = { ...iv, status: "Verified", result };
  return Object.freeze(next);
}

export function markFailed(
  iv: IdentityVerification,
  issuedAt: IsoTimestamp,
): IdentityVerification {
  if (!canCompleteIdentity(iv)) {
    throw new IllegalTransitionError(
      `Cannot fail an identity verification in status ${iv.status}`,
    );
  }
  const result: VerificationResult = Object.freeze({
    outcome: "Failed",
    issuedAt,
    expiresAt: null,
  });
  const next: IdentityVerification = { ...iv, status: "Failed", result };
  return Object.freeze(next);
}

export function expire(iv: IdentityVerification): IdentityVerification {
  if (!canExpireIdentity(iv)) {
    throw new IllegalTransitionError(
      `Cannot expire an identity verification in status ${iv.status}`,
    );
  }
  const next: IdentityVerification = { ...iv, status: "Expired" };
  return Object.freeze(next);
}

export function retry(iv: IdentityVerification): IdentityVerification {
  if (!canRetryIdentity(iv)) {
    throw new IllegalTransitionError(
      `Cannot retry an identity verification in status ${iv.status}`,
    );
  }
  const next: IdentityVerification = {
    ...iv,
    status: "Initiated",
    result: null,
  };
  return Object.freeze(next);
}

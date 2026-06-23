import { IllegalTransitionError } from "./errors.js";
import { canDecidePhoto, canReviewPhoto } from "./specifications.js";
import type {
  IsoTimestamp,
  PhotoResult,
  PhotoSubjectType,
  PhotoVerificationId,
  PhotoVerificationStatus,
} from "./value-objects.js";

/**
 * PhotoVerification aggregate root (Verification context).
 *
 * Immutable: every transition returns a new frozen aggregate. Owns its
 * lifecycle invariants (Submitted → UnderReview → Approved | Rejected) and the
 * rule that an Approved decision is immutable. `subjectId` / `leaseId` are
 * id-only references. Timestamps are injected (no ambient clock in the domain).
 */
export interface PhotoVerification {
  readonly id: PhotoVerificationId;
  readonly subjectType: PhotoSubjectType;
  readonly subjectId: string;
  readonly leaseId: string | null;
  readonly status: PhotoVerificationStatus;
  readonly result: PhotoResult | null;
}

export interface SubmitPhotoProps {
  id: PhotoVerificationId;
  subjectType: PhotoSubjectType;
  subjectId: string;
  leaseId?: string | null;
}

export function submit(props: SubmitPhotoProps): PhotoVerification {
  const pv: PhotoVerification = {
    id: props.id,
    subjectType: props.subjectType,
    subjectId: props.subjectId,
    leaseId: props.leaseId ?? null,
    status: "Submitted",
    result: null,
  };
  return Object.freeze(pv);
}

export function startReview(pv: PhotoVerification): PhotoVerification {
  if (!canReviewPhoto(pv)) {
    throw new IllegalTransitionError(
      `Cannot review a photo verification in status ${pv.status}`,
    );
  }
  const next: PhotoVerification = { ...pv, status: "UnderReview" };
  return Object.freeze(next);
}

export function approve(
  pv: PhotoVerification,
  decidedAt: IsoTimestamp,
): PhotoVerification {
  if (!canDecidePhoto(pv)) {
    throw new IllegalTransitionError(
      `Cannot approve a photo verification in status ${pv.status}`,
    );
  }
  const result: PhotoResult = Object.freeze({ outcome: "Approved", decidedAt });
  const next: PhotoVerification = { ...pv, status: "Approved", result };
  return Object.freeze(next);
}

export function reject(
  pv: PhotoVerification,
  decidedAt: IsoTimestamp,
): PhotoVerification {
  if (!canDecidePhoto(pv)) {
    throw new IllegalTransitionError(
      `Cannot reject a photo verification in status ${pv.status}`,
    );
  }
  const result: PhotoResult = Object.freeze({ outcome: "Rejected", decidedAt });
  const next: PhotoVerification = { ...pv, status: "Rejected", result };
  return Object.freeze(next);
}

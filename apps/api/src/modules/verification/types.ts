import type {
  IdentityOutcome,
  IdentityVerificationStatus,
  PhotoOutcome,
  PhotoSubjectType,
  PhotoVerificationStatus,
} from "./domain/value-objects.js";

export interface InitiateIdentityInput {
  partyId: string;
}

export interface VerifyIdentityInput {
  expiresAt?: string;
}

export interface SubmitPhotoInput {
  subjectType: string;
  subjectId: string;
  leaseId?: string;
}

export interface IdentityVerificationView {
  id: string;
  partyId: string;
  status: IdentityVerificationStatus;
  result: {
    outcome: IdentityOutcome;
    issuedAt: string;
    expiresAt: string | null;
  } | null;
}

export interface PhotoVerificationView {
  id: string;
  subjectType: PhotoSubjectType;
  subjectId: string;
  leaseId: string | null;
  status: PhotoVerificationStatus;
  result: { outcome: PhotoOutcome; decidedAt: string } | null;
}

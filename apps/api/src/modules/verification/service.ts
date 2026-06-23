import { randomUUID } from "node:crypto";

import { NotFoundError } from "./domain/errors.js";
import {
  expire,
  initiate,
  markFailed,
  markVerified,
  retry,
  start,
} from "./domain/identity-verification.js";
import type { IdentityVerification } from "./domain/identity-verification.js";
import {
  approve,
  reject,
  startReview,
  submit,
} from "./domain/photo-verification.js";
import type { PhotoVerification } from "./domain/photo-verification.js";
import {
  makeIdentityVerificationId,
  makeIsoTimestamp,
  makePartyRef,
  makePhotoVerificationId,
  makeSubjectRef,
  makeSubjectType,
} from "./domain/value-objects.js";
import { identityVerificationRepository } from "./identity-repository.js";
import { photoVerificationRepository } from "./photo-repository.js";
import type {
  IdentityVerificationView,
  InitiateIdentityInput,
  PhotoVerificationView,
  SubmitPhotoInput,
  VerifyIdentityInput,
} from "./types.js";

/**
 * Verification application service — orchestrates the IdentityVerification and
 * PhotoVerification aggregates and their repositories per use case. No business
 * rules here: invariants live in the aggregates, validation in the Value
 * Objects. Id and timestamp generation (infrastructure) happen here and are
 * injected into the aggregates, never read ambiently inside them.
 */
function nowIso(): string {
  return new Date().toISOString();
}

function toIdentityView(iv: IdentityVerification): IdentityVerificationView {
  return {
    id: iv.id,
    partyId: iv.partyId,
    status: iv.status,
    result: iv.result
      ? {
          outcome: iv.result.outcome,
          issuedAt: iv.result.issuedAt,
          expiresAt: iv.result.expiresAt,
        }
      : null,
  };
}

function toPhotoView(pv: PhotoVerification): PhotoVerificationView {
  return {
    id: pv.id,
    subjectType: pv.subjectType,
    subjectId: pv.subjectId,
    leaseId: pv.leaseId,
    status: pv.status,
    result: pv.result
      ? { outcome: pv.result.outcome, decidedAt: pv.result.decidedAt }
      : null,
  };
}

function loadIdentityOrThrow(id: string): IdentityVerification {
  const iv = identityVerificationRepository.findById(
    makeIdentityVerificationId(id),
  );
  if (!iv) {
    throw new NotFoundError(`IdentityVerification ${id} not found`);
  }
  return iv;
}

function loadPhotoOrThrow(id: string): PhotoVerification {
  const pv = photoVerificationRepository.findById(makePhotoVerificationId(id));
  if (!pv) {
    throw new NotFoundError(`PhotoVerification ${id} not found`);
  }
  return pv;
}

// ── Identity verification use cases ─────────────────────────────────────────

export function initiateIdentity(
  input: InitiateIdentityInput,
): IdentityVerificationView {
  const iv = initiate({
    id: makeIdentityVerificationId(randomUUID()),
    partyId: makePartyRef(input.partyId),
  });
  return toIdentityView(identityVerificationRepository.save(iv));
}

export function getIdentity(id: string): IdentityVerificationView | null {
  const iv = identityVerificationRepository.findById(
    makeIdentityVerificationId(id),
  );
  return iv ? toIdentityView(iv) : null;
}

export function listIdentity(): readonly IdentityVerificationView[] {
  return identityVerificationRepository.findAll().map(toIdentityView);
}

export function startIdentity(id: string): IdentityVerificationView {
  return toIdentityView(
    identityVerificationRepository.save(start(loadIdentityOrThrow(id))),
  );
}

export function verifyIdentity(
  id: string,
  input: VerifyIdentityInput,
): IdentityVerificationView {
  const expiresAt = input.expiresAt ? makeIsoTimestamp(input.expiresAt) : null;
  return toIdentityView(
    identityVerificationRepository.save(
      markVerified(loadIdentityOrThrow(id), makeIsoTimestamp(nowIso()), expiresAt),
    ),
  );
}

export function failIdentity(id: string): IdentityVerificationView {
  return toIdentityView(
    identityVerificationRepository.save(
      markFailed(loadIdentityOrThrow(id), makeIsoTimestamp(nowIso())),
    ),
  );
}

export function expireIdentity(id: string): IdentityVerificationView {
  return toIdentityView(
    identityVerificationRepository.save(expire(loadIdentityOrThrow(id))),
  );
}

export function retryIdentity(id: string): IdentityVerificationView {
  return toIdentityView(
    identityVerificationRepository.save(retry(loadIdentityOrThrow(id))),
  );
}

// ── Photo verification use cases ────────────────────────────────────────────

export function submitPhoto(input: SubmitPhotoInput): PhotoVerificationView {
  const pv = submit({
    id: makePhotoVerificationId(randomUUID()),
    subjectType: makeSubjectType(input.subjectType),
    subjectId: makeSubjectRef(input.subjectId),
    leaseId: input.leaseId ?? null,
  });
  return toPhotoView(photoVerificationRepository.save(pv));
}

export function getPhoto(id: string): PhotoVerificationView | null {
  const pv = photoVerificationRepository.findById(makePhotoVerificationId(id));
  return pv ? toPhotoView(pv) : null;
}

export function listPhoto(): readonly PhotoVerificationView[] {
  return photoVerificationRepository.findAll().map(toPhotoView);
}

export function reviewPhoto(id: string): PhotoVerificationView {
  return toPhotoView(
    photoVerificationRepository.save(startReview(loadPhotoOrThrow(id))),
  );
}

export function approvePhoto(id: string): PhotoVerificationView {
  return toPhotoView(
    photoVerificationRepository.save(
      approve(loadPhotoOrThrow(id), makeIsoTimestamp(nowIso())),
    ),
  );
}

export function rejectPhoto(id: string): PhotoVerificationView {
  return toPhotoView(
    photoVerificationRepository.save(
      reject(loadPhotoOrThrow(id), makeIsoTimestamp(nowIso())),
    ),
  );
}

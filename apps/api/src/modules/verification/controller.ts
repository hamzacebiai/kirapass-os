import type { Request, Response } from "express";

import { AppDomainError } from "./domain/errors.js";
import {
  approvePhoto,
  expireIdentity,
  failIdentity,
  getIdentity,
  getPhoto,
  initiateIdentity,
  listIdentity,
  listPhoto,
  rejectPhoto,
  retryIdentity,
  reviewPhoto,
  startIdentity,
  submitPhoto,
  verifyIdentity,
} from "./service.js";

/**
 * Verification controller — req/res only. Maps domain/validation errors to HTTP
 * status; no business logic. Unknown errors propagate to the global error
 * middleware.
 */
function fail(res: Response, err: unknown): void {
  if (err instanceof AppDomainError) {
    res.status(err.status).json({ error: err.kind, message: err.message });
    return;
  }
  throw err;
}

// ── Identity ────────────────────────────────────────────────────────────────

export function listIdentityController(_req: Request, res: Response): void {
  res.json(listIdentity());
}

export function initiateIdentityController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as { partyId?: unknown };
    res
      .status(201)
      .json(initiateIdentity({ partyId: String(body.partyId ?? "") }));
  } catch (err) {
    fail(res, err);
  }
}

export function getIdentityController(req: Request, res: Response): void {
  const iv = getIdentity(String(req.params.id));
  if (!iv) {
    res.status(404).json({
      error: "NotFound",
      message: "IdentityVerification not found",
    });
    return;
  }
  res.json(iv);
}

export function startIdentityController(req: Request, res: Response): void {
  try {
    res.json(startIdentity(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function verifyIdentityController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as { expiresAt?: unknown };
    res.json(
      verifyIdentity(String(req.params.id), {
        expiresAt:
          body.expiresAt === undefined ? undefined : String(body.expiresAt),
      }),
    );
  } catch (err) {
    fail(res, err);
  }
}

export function failIdentityController(req: Request, res: Response): void {
  try {
    res.json(failIdentity(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function expireIdentityController(req: Request, res: Response): void {
  try {
    res.json(expireIdentity(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function retryIdentityController(req: Request, res: Response): void {
  try {
    res.json(retryIdentity(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

// ── Photo ─────────────────────────────────────────────────────────────────

export function listPhotoController(_req: Request, res: Response): void {
  res.json(listPhoto());
}

export function submitPhotoController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.status(201).json(
      submitPhoto({
        subjectType: String(body.subjectType ?? ""),
        subjectId: String(body.subjectId ?? ""),
        leaseId: body.leaseId === undefined ? undefined : String(body.leaseId),
      }),
    );
  } catch (err) {
    fail(res, err);
  }
}

export function getPhotoController(req: Request, res: Response): void {
  const pv = getPhoto(String(req.params.id));
  if (!pv) {
    res
      .status(404)
      .json({ error: "NotFound", message: "PhotoVerification not found" });
    return;
  }
  res.json(pv);
}

export function reviewPhotoController(req: Request, res: Response): void {
  try {
    res.json(reviewPhoto(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function approvePhotoController(req: Request, res: Response): void {
  try {
    res.json(approvePhoto(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function rejectPhotoController(req: Request, res: Response): void {
  try {
    res.json(rejectPhoto(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

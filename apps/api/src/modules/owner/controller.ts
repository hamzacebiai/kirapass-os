import type { Request, Response } from "express";

import { AppDomainError } from "./domain/errors.js";
import {
  activateOwner,
  archiveOwner,
  getOwner,
  listOwners,
  registerOwner,
  setPayoutIban,
  verifyOwner,
} from "./service.js";

/**
 * Owner controller — req/res only. Maps domain/validation errors to HTTP
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

export function listOwnersController(_req: Request, res: Response): void {
  res.json(listOwners());
}

export function registerOwnerController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.status(201).json(
      registerOwner({
        fullName: String(body.fullName ?? ""),
        nationalId: String(body.nationalId ?? ""),
        phone: String(body.phone ?? ""),
        email: String(body.email ?? ""),
        payoutIban:
          body.payoutIban === undefined ? undefined : String(body.payoutIban),
        accountId:
          body.accountId === undefined ? undefined : String(body.accountId),
        partnerId:
          body.partnerId === undefined ? undefined : String(body.partnerId),
      }),
    );
  } catch (err) {
    fail(res, err);
  }
}

export function getOwnerController(req: Request, res: Response): void {
  const owner = getOwner(String(req.params.id));
  if (!owner) {
    res.status(404).json({ error: "NotFound", message: "Owner not found" });
    return;
  }
  res.json(owner);
}

export function verifyOwnerController(req: Request, res: Response): void {
  try {
    res.json(verifyOwner(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function setPayoutIbanController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as { iban?: unknown };
    res.json(setPayoutIban(String(req.params.id), String(body.iban ?? "")));
  } catch (err) {
    fail(res, err);
  }
}

export function activateOwnerController(req: Request, res: Response): void {
  try {
    res.json(activateOwner(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function archiveOwnerController(req: Request, res: Response): void {
  try {
    res.json(archiveOwner(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

import type { Request, Response } from "express";

import { AppDomainError } from "./domain/errors.js";
import {
  activatePartner,
  archivePartner,
  assignStewardship,
  getPartner,
  listPartners,
  onboardPartner,
  revokeStewardship,
  suspendPartner,
} from "./service.js";

/**
 * Partner controller — req/res only. Maps domain/validation errors to HTTP
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

export function listPartnersController(_req: Request, res: Response): void {
  res.json(listPartners());
}

export function onboardPartnerController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.status(201).json(
      onboardPartner({
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        phone: String(body.phone ?? ""),
        accountId:
          body.accountId === undefined ? undefined : String(body.accountId),
      }),
    );
  } catch (err) {
    fail(res, err);
  }
}

export function getPartnerController(req: Request, res: Response): void {
  const partner = getPartner(String(req.params.id));
  if (!partner) {
    res.status(404).json({ error: "NotFound", message: "Partner not found" });
    return;
  }
  res.json(partner);
}

export function activatePartnerController(req: Request, res: Response): void {
  try {
    res.json(activatePartner(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function suspendPartnerController(req: Request, res: Response): void {
  try {
    res.json(suspendPartner(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function archivePartnerController(req: Request, res: Response): void {
  try {
    res.json(archivePartner(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function assignStewardshipController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as { ownerId?: unknown };
    res.json(
      assignStewardship(String(req.params.id), String(body.ownerId ?? "")),
    );
  } catch (err) {
    fail(res, err);
  }
}

export function revokeStewardshipController(req: Request, res: Response): void {
  try {
    res.json(
      revokeStewardship(String(req.params.id), String(req.params.ownerId)),
    );
  } catch (err) {
    fail(res, err);
  }
}

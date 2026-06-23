import type { Request, Response } from "express";

import { AppDomainError } from "./domain/errors.js";
import {
  activateTenant,
  archiveTenant,
  getTenant,
  listTenants,
  markTenantPast,
  registerTenant,
  verifyTenant,
} from "./service.js";

/**
 * Tenant controller — req/res only. Maps domain/validation errors to HTTP
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

export function listTenantsController(_req: Request, res: Response): void {
  res.json(listTenants());
}

export function registerTenantController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.status(201).json(
      registerTenant({
        fullName: String(body.fullName ?? ""),
        nationalId: String(body.nationalId ?? ""),
        phone: String(body.phone ?? ""),
        email: String(body.email ?? ""),
        accountId:
          body.accountId === undefined ? undefined : String(body.accountId),
      }),
    );
  } catch (err) {
    fail(res, err);
  }
}

export function getTenantController(req: Request, res: Response): void {
  const tenant = getTenant(String(req.params.id));
  if (!tenant) {
    res.status(404).json({ error: "NotFound", message: "Tenant not found" });
    return;
  }
  res.json(tenant);
}

export function verifyTenantController(req: Request, res: Response): void {
  try {
    res.json(verifyTenant(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function activateTenantController(req: Request, res: Response): void {
  try {
    res.json(activateTenant(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function markTenantPastController(req: Request, res: Response): void {
  try {
    res.json(markTenantPast(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function archiveTenantController(req: Request, res: Response): void {
  try {
    res.json(archiveTenant(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

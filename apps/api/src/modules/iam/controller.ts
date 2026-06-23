import type { Request, Response } from "express";

import { AppDomainError } from "./domain/errors.js";
import {
  activateAccount,
  assignRole,
  closeAccount,
  getAccount,
  inviteAccount,
  listAccounts,
  suspendAccount,
} from "./service.js";

/**
 * IAM controller — req/res only. Maps domain/validation errors to HTTP status;
 * no business logic. Unknown errors propagate to the global error middleware.
 */
function fail(res: Response, err: unknown): void {
  if (err instanceof AppDomainError) {
    res.status(err.status).json({ error: err.kind, message: err.message });
    return;
  }
  throw err;
}

export function listAccountsController(_req: Request, res: Response): void {
  res.json(listAccounts());
}

export function inviteAccountController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as {
      email?: unknown;
      role?: unknown;
      partyId?: unknown;
    };
    res.status(201).json(
      inviteAccount({
        email: String(body.email ?? ""),
        role: String(body.role ?? ""),
        partyId: body.partyId === undefined ? undefined : String(body.partyId),
      }),
    );
  } catch (err) {
    fail(res, err);
  }
}

export function getAccountController(req: Request, res: Response): void {
  const account = getAccount(String(req.params.id));
  if (!account) {
    res.status(404).json({ error: "NotFound", message: "Account not found" });
    return;
  }
  res.json(account);
}

export function activateAccountController(req: Request, res: Response): void {
  try {
    res.json(activateAccount(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function suspendAccountController(req: Request, res: Response): void {
  try {
    res.json(suspendAccount(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function closeAccountController(req: Request, res: Response): void {
  try {
    res.json(closeAccount(String(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
}

export function assignRoleController(req: Request, res: Response): void {
  try {
    const body = (req.body ?? {}) as { role?: unknown };
    res.json(assignRole(String(req.params.id), String(body.role ?? "")));
  } catch (err) {
    fail(res, err);
  }
}

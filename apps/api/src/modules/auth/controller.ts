import type { Request, Response } from "express";

import { login } from "./service.js";
import type { LoginDto } from "./types.js";

/**
 * Auth controller — thin req/res wrapper.
 *
 * Responsibilities: safely map the request body into the service DTO, call
 * the service, format the response. No business logic, no inline decisions.
 */
export function loginController(req: Request, res: Response): void {
  const body = (req.body ?? {}) as Partial<LoginDto>;

  const credentials: LoginDto = {
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
  };

  res.json(login(credentials));
}

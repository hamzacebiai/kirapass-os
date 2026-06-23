import type { Request, Response } from "express";

import { getExample } from "./service.js";

/**
 * TEMPLATE — controller layer (req/res wrapper only).
 *
 * Rules:
 *   - Receives (req, res), calls the service, formats the response.
 *   - NO business logic. If you need a decision/computation, it belongs in
 *     the service.
 *   - Depends on the service only — never the other way around.
 */
export function exampleController(_req: Request, res: Response): void {
  res.json(getExample());
}

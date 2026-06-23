import type { Request, Response } from "express";

import { getHealth } from "./service.js";

/**
 * Health controller. Receives req/res, delegates to the service, formats the
 * HTTP response. No business logic.
 */
export function healthController(_req: Request, res: Response): void {
  res.json(getHealth());
}

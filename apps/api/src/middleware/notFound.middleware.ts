import type { Request, Response } from "express";

/**
 * Terminal handler for requests that matched no route.
 *
 * Infrastructure-only: it produces a consistent 404 envelope. No business
 * logic lives here. Registered last in the app pipeline, after all routers.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "Not Found",
    method: req.method,
    path: req.originalUrl,
  });
}

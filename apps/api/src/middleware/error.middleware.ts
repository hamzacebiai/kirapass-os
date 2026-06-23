import type { NextFunction, Request, Response } from "express";

/**
 * Centralized error-handling middleware.
 *
 * Infrastructure-only: it normalizes any error thrown in the request
 * pipeline into a single response shape. Domain/business error mapping is
 * intentionally NOT implemented here yet — this is the boundary where it
 * will later be introduced.
 *
 * Must be registered last (Express identifies it by its four arguments).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : "Internal Server Error";

  res.status(500).json({
    error: "Internal Server Error",
    message,
  });
}

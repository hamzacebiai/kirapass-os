import express, { type Express } from "express";

import { API_PREFIX } from "./config/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import apiRoutes from "./routes/index.js";

/**
 * Application composition root.
 *
 * Builds and returns a fully wired Express instance. This factory owns the
 * HTTP pipeline (parsers, routers, cross-cutting middleware) but knows
 * nothing about the network: it never calls `listen` and never reads the
 * environment. That keeps the app pure and trivially testable — a caller
 * can `createApp()` and drive it in-memory.
 *
 * Pipeline order is significant:
 *   1. body parsing
 *   2. feature routers (mounted under the API prefix)
 *   3. not-found handler (no router matched)
 *   4. error handler (terminal, four-arg)
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use(API_PREFIX, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

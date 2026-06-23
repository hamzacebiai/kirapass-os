/**
 * Static application metadata.
 *
 * These values are compile-time constants that do not depend on the
 * runtime environment. Environment-derived values live in `env.ts`.
 */
export const APP = {
  name: "KiraPass API",
  version: "1.0.0",
} as const;

/**
 * Base path under which all API routers are mounted.
 */
export const API_PREFIX = "/api";

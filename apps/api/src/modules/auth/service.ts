import type { AuthResult, LoginDto } from "./types.js";

/**
 * Auth service — pure business logic, framework-agnostic.
 *
 * Rules honored:
 *   - No express, no req/res, no HTTP concerns.
 *   - Returns a typed domain object (`AuthResult`).
 *   - Deterministic: identical input always yields identical output (no
 *     randomness, no clock). This keeps the mock stable and testable.
 *
 * This is the seam where the JWT phase plugs in: replace the placeholder
 * token derivation below with real signing. The signature does not change.
 */
export function login(credentials: LoginDto): AuthResult {
  const token = `mock.${Buffer.from(credentials.email).toString("base64url")}`;

  return {
    tokenType: "Bearer",
    token,
    user: { email: credentials.email },
  };
}

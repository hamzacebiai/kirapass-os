/**
 * Auth feature — DTOs and domain shapes.
 *
 * DTO-only: no logic here. These types are the contract between the
 * controller (maps the HTTP request into them) and the service (consumes /
 * returns them). The JWT phase will extend `AuthResult` without touching the
 * controller or routes.
 */

/** Inbound credentials, mapped from the request body by the controller. */
export interface LoginDto {
  email: string;
  password: string;
}

/** Authenticated principal returned by the service. */
export interface AuthenticatedUser {
  email: string;
}

/**
 * Result of a successful authentication.
 *
 * `token` is a deterministic placeholder today; the JWT phase will replace
 * the value's origin only — the shape stays stable.
 */
export interface AuthResult {
  tokenType: "Bearer";
  token: string;
  user: AuthenticatedUser;
}

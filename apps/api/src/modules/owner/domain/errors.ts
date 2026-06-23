/**
 * Owner domain/application errors (local to this module).
 *
 * Mapped to HTTP status by the controller. A shared cross-module error taxonomy
 * is now justified by ≥2 uses (IAM + Owner) but is intentionally deferred here
 * to avoid modifying the completed IAM module mid-step; tracked as a future
 * refactor (see module README).
 */
export type ErrorKind = "ValidationError" | "NotFound" | "IllegalTransition";

export class AppDomainError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = kind;
  }
}

export class ValidationError extends AppDomainError {
  constructor(message: string) {
    super("ValidationError", 400, message);
  }
}

export class NotFoundError extends AppDomainError {
  constructor(message: string) {
    super("NotFound", 404, message);
  }
}

export class IllegalTransitionError extends AppDomainError {
  constructor(message: string) {
    super("IllegalTransition", 409, message);
  }
}

/**
 * IAM domain/application errors (local to this module).
 *
 * Mapped to HTTP status by the controller. A shared cross-module error
 * taxonomy is intentionally NOT introduced yet (abstraction justified only by
 * ≥2 concrete uses — see IMPLEMENTATION_CONTRACT §1).
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

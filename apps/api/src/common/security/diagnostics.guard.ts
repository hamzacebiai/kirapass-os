import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Protects diagnostic/observability endpoints in production. Additive, fail-safe.
 *
 * - Non-production (NODE_ENV !== 'production'): always allowed (dev unchanged).
 * - Production: allowed ONLY if the request carries header
 *   `x-internal-token` matching env `DIAGNOSTICS_TOKEN`. If the token is unset,
 *   access is denied (closed by default in prod).
 *
 * Liveness/readiness (`/health`, `/health/live`, `/health/ready`) are NOT
 * guarded so orchestrators keep probing.
 */
@Injectable()
export class DiagnosticsGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    try {
      if ((process.env.NODE_ENV ?? 'development') !== 'production') {
        return true;
      }
      const req = ctx.switchToHttp().getRequest();
      const expected = process.env.DIAGNOSTICS_TOKEN;
      const provided = req?.headers?.['x-internal-token'];
      return Boolean(expected) && provided === expected;
    } catch {
      return false; // fail-closed for diagnostics
    }
  }
}

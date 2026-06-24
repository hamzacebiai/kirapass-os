import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRequestContext } from '../request-context';
import { getCorrelationId } from '../observability/request-context-ext';
import { AuditService } from '../audit/audit.service';
import { RateLimitService } from './rate-limit.service';

function limitsFor(route: string): { limit: number; windowMs: number } {
  const r = route.toLowerCase();
  if (r.includes('/auth/login')) return { limit: 5, windowMs: 60_000 };
  if (r.includes('/auth/register')) return { limit: 3, windowMs: 60_000 };
  return { limit: 60, windowMs: 60_000 };
}

/**
 * Global throttle guard (APP_GUARD). Runs before route guards, so it does a
 * best-effort JWT decode ONLY to derive the tenant key + SYSTEM_ADMIN bypass —
 * it does NOT perform authorization (JwtAuthGuard still does the real auth).
 * Fail-open: any internal error allows the request.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimit: RateLimitService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    try {
      const req = ctx.switchToHttp().getRequest();
      const route: string = req.route?.path ?? req.url ?? 'unknown';

      this.tryPopulateContext(req);

      const reqCtx = getRequestContext();
      if (reqCtx?.role === 'SYSTEM_ADMIN') {
        return true; // bypass
      }

      const { limit, windowMs } = limitsFor(route);
      const ip = (
        req.ip ||
        req.headers?.['x-forwarded-for'] ||
        'unknown'
      ).toString();

      const allowed = this.rateLimit.check(route, ip, limit, windowMs);
      if (!allowed) {
        void this.audit.log({
          eventType: 'auth.rate_limited',
          action: 'throttle',
          resource: route,
          metadata: {
            errorCode: 'RATE_LIMITED',
            limit,
            windowMs,
            ip,
            route,
            correlationId: getCorrelationId() ?? null,
          },
        });
        throw new HttpException(
          'Too Many Requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return true;
    } catch (e) {
      if (e instanceof HttpException) throw e; // propagate the 429
      return true; // fail-open on any unexpected error
    }
  }

  // Best-effort: fill ALS from a valid Bearer token for keying/bypass only.
  private tryPopulateContext(req: any): void {
    try {
      const auth: string | undefined = req.headers?.['authorization'];
      if (!auth || !auth.startsWith('Bearer ')) return;
      const payload: any = this.jwt.verify(auth.slice(7));
      const store = getRequestContext();
      if (store) {
        store.userId = payload.sub;
        store.agencyId = payload.agencyId;
        store.role = payload.role;
      }
    } catch {
      // invalid/absent token -> treat as anonymous (ip keying)
    }
  }
}

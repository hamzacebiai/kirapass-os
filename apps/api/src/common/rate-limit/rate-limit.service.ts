import { Injectable } from '@nestjs/common';
import { getRequestContext } from '../request-context';
import { rateLimitStore } from './rate-limit.store';

/**
 * Tenant-aware rate limit check. Key strategy:
 *   authenticated -> agencyId + userId + route
 *   anonymous     -> ip + route
 * Never throws — returns boolean only (fail-open on any internal error).
 */
@Injectable()
export class RateLimitService {
  check(route: string, ip: string, limit: number, windowMs: number): boolean {
    try {
      const ctx = getRequestContext();
      const identity = ctx?.userId
        ? `u:${ctx.agencyId}:${ctx.userId}`
        : `ip:${ip}`;
      return rateLimitStore.hit(`${identity}:${route}`, limit, windowMs);
    } catch {
      return true; // fail-open
    }
  }
}

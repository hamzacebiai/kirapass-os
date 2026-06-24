import { Injectable } from '@nestjs/common';
import { getRequestContext } from '../request-context';
import { sanitize } from '../observability/log-sanitizer';
import { AuditEvent } from './audit-event.type';

/**
 * Fail-safe, fire-and-forget audit logger. NEVER throws / NEVER blocks. Enriches
 * with ALS context (correlationId/userId/agencyId/role), sanitizes sensitive
 * keys, and suppresses duplicate eventType+correlationId within a short window.
 */
@Injectable()
export class AuditService {
  private readonly seen = new Map<string, number>();

  async log(event: AuditEvent): Promise<void> {
    try {
      const ctx = getRequestContext();
      const correlationId = ctx?.correlationId ?? null;
      if (this.isDuplicate(`${event.eventType}:${correlationId}`)) {
        return;
      }
      const record = sanitize({
        correlationId,
        ...event,
        userId: event.userId ?? ctx?.userId ?? null,
        agencyId: event.agencyId ?? ctx?.agencyId ?? null,
        role: ctx?.role ?? null,
        timestamp: event.timestamp ?? new Date().toISOString(),
      });
      // eslint-disable-next-line no-console
      console.log(`[AUDIT] ${JSON.stringify(record)}`);
    } catch {
      // Fail-safe: auditing must never break the request flow.
    }
  }

  private isDuplicate(key: string): boolean {
    const now = Date.now();
    const last = this.seen.get(key);
    if (last && now - last < 2000) {
      return true;
    }
    this.seen.set(key, now);
    if (this.seen.size > 1000) {
      for (const [k, t] of this.seen) {
        if (now - t > 5000) this.seen.delete(k);
      }
    }
    return false;
  }
}

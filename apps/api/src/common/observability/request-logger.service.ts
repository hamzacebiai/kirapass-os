import { Injectable } from '@nestjs/common';

/**
 * Lightweight request lifecycle logger. Fire-and-forget JSON to console. Never
 * throws. Only start + end (with duration/status) — no per-operation noise.
 */
@Injectable()
export class RequestLoggerService {
  start(correlationId: string, method: string, path: string): void {
    try {
      console.log(
        `[AUDIT_TRACE] ${JSON.stringify({ phase: 'start', correlationId, method, path })}`,
      );
    } catch {
      // fail-safe
    }
  }

  end(
    correlationId: string,
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
  ): void {
    try {
      console.log(
        `[AUDIT_TRACE] ${JSON.stringify({ phase: 'end', correlationId, method, path, statusCode, durationMs })}`,
      );
    } catch {
      // fail-safe
    }
  }
}

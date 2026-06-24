import { Injectable, NestMiddleware } from '@nestjs/common';
import { getRequestContext } from '../request-context';
import { sanitize } from './log-sanitizer';

/**
 * Diagnostics only. Measures request duration via process.hrtime.bigint(),
 * emits [REQUEST_COMPLETE] for every request and one [SLOW_REQUEST] when it
 * exceeds 1000ms. Never throws, never modifies request/response. Reads context
 * from the captured ALS store reference (populated during the request).
 */
const SLOW_MS = 1000;

@Injectable()
export class RequestTimingMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const start = process.hrtime.bigint();
    const store = getRequestContext();
    try {
      res.on('finish', () => {
        try {
          const durationMs =
            Math.round((Number(process.hrtime.bigint() - start) / 1e6) * 100) /
            100;
          const base = {
            correlationId: store?.correlationId ?? req.correlationId ?? null,
            method: req.method,
            path: req.originalUrl ?? req.url,
            statusCode: res.statusCode,
            durationMs,
          };
          console.log(`[REQUEST_COMPLETE] ${JSON.stringify(sanitize(base))}`);
          if (durationMs > SLOW_MS) {
            console.log(
              `[SLOW_REQUEST] ${JSON.stringify(
                sanitize({
                  ...base,
                  userId: store?.userId ?? null,
                  agencyId: store?.agencyId ?? null,
                }),
              )}`,
            );
          }
        } catch {
          // never throw from diagnostics
        }
      });
    } catch {
      // never throw
    }
    next();
  }
}

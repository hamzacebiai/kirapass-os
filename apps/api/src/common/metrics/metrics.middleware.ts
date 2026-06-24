import { Injectable, NestMiddleware } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * Read-only, fail-safe HTTP metrics collector. Records duration + count on
 * res.finish using the matched route pattern (low cardinality — no ids).
 * Never modifies or blocks the request.
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: any, res: any, next: () => void) {
    const start = process.hrtime.bigint();
    try {
      res.on('finish', () => {
        try {
          const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
          const route = req.route?.path ?? 'unmatched';
          this.metrics.observe(req.method, route, res.statusCode, durationSec);
        } catch {
          // never throw
        }
      });
    } catch {
      // never throw
    }
    next();
  }
}

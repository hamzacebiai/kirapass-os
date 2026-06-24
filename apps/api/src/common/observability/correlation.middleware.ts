import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { requestContext } from '../request-context';
import { RequestLoggerService } from './request-logger.service';

/**
 * Runs FIRST. Establishes the ALS store seeded with a correlationId (from
 * x-request-id or generated), attaches it to req, and logs request start/end.
 * Never throws; always continues.
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly logger: RequestLoggerService) {}

  use(req: any, res: any, next: () => void) {
    let id: string;
    try {
      const header = req?.headers?.['x-request-id'];
      id = (typeof header === 'string' && header) || randomUUID();
    } catch {
      id = `req-${Date.now()}`;
    }
    try {
      req.correlationId = id;
    } catch {
      // ignore
    }

    const startedAt = Date.now();
    requestContext.run({ correlationId: id }, () => {
      this.logger.start(id, req.method, req.originalUrl ?? req.url);
      try {
        res.on('finish', () => {
          this.logger.end(
            id,
            req.method,
            req.originalUrl ?? req.url,
            res.statusCode,
            Date.now() - startedAt,
          );
        });
      } catch {
        // ignore listener errors
      }
      next();
    });
  }
}

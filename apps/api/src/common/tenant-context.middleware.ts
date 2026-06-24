import { Injectable, NestMiddleware } from '@nestjs/common';
import { requestContext } from './request-context';

/**
 * Establishes a per-request AsyncLocalStorage store for the whole request
 * lifecycle (guards, handler, async). JwtStrategy fills it after token verify.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(_req: any, _res: any, next: () => void) {
    // Reuse an already-established store (e.g. from CorrelationMiddleware) so a
    // seeded correlationId is preserved; otherwise establish one.
    if (requestContext.getStore()) {
      return next();
    }
    requestContext.run({}, () => next());
  }
}

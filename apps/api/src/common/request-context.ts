import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  userId?: string;
  agencyId?: string;
  role?: string;
  correlationId?: string;
}

// Per-request store. Established by TenantContextMiddleware, filled by JwtStrategy.
export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}

import { getRequestContext } from '../request-context';

// Correlation helpers over the existing ALS request context (backward-compatible).
export function getCorrelationId(): string | undefined {
  return getRequestContext()?.correlationId;
}

export function setCorrelationId(id: string): void {
  const store = getRequestContext();
  if (store) {
    store.correlationId = id;
  }
}

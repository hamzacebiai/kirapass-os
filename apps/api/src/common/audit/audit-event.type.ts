// Lightweight, in-code audit event (no DB). Resilient observability only.
export type AuditEventType =
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.register.success'
  | 'auth.rbac.denied'
  | 'auth.rate_limited'
  | 'tenant.access'
  | 'domain.mutation';

export interface AuditEvent {
  eventType: AuditEventType;
  action: string;
  resource: string;
  userId?: string;
  agencyId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  method?: string;
  statusCode?: number;
  correlationId?: string;
  timestamp?: string;
}

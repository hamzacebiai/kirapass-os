export type IncidentPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'OPEN' | 'ANALYZING' | 'PATCH_READY' | 'DEPLOYED' | 'CLOSED';
export type IncidentLayer = 'AUTH' | 'PAYMENT' | 'LEASE' | 'PROPERTY' | 'TENANT' | 'RENT_SCHEDULE' | 'UNIT' | 'USERS' | 'HEALTH' | 'INFRA';

export interface IncidentSignal {
  source: 'exception_filter' | 'manual' | 'health_check' | 'metric_threshold';
  layer: IncidentLayer;
  message: string;
  stack?: string;
  correlationId?: string;
  userId?: string;
  path?: string;
  statusCode?: number;
  timestamp: Date;
  meta?: Record<string, unknown>;
}

export interface IncidentReport {
  id: string;
  signal: IncidentSignal;
  priority: IncidentPriority;
  status: IncidentStatus;
  rootCause?: string;
  patchInstructions?: string;
  aiAnalysis?: string;
  openedAt: Date;
  closedAt?: Date;
  mttrMs?: number;
}

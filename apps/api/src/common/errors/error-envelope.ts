// Stable error log/response shape. Shape only — no logic.
export interface ErrorEnvelope {
  correlationId: string | null;
  path: string;
  method: string;
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  tier: '4xx' | '5xx';
  userId?: string | null;
  agencyId?: string | null;
  stack?: string; // DEV only
}

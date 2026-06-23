import { APP } from "../../config/index.js";

export interface HealthStatus {
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
}

/**
 * Health business logic. No express, no req/res — returns a plain object.
 */
export function getHealth(): HealthStatus {
  return {
    status: "ok",
    service: APP.name,
    version: APP.version,
    timestamp: new Date().toISOString(),
  };
}

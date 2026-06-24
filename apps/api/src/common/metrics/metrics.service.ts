import { Injectable } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from 'prom-client';

/**
 * Prometheus registry + HTTP instruments. Default process/event-loop/GC/node
 * metrics collected automatically. Labels kept low-cardinality (method, route,
 * status only). All methods fail-safe.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  private readonly httpRequests: Counter<string>;
  private readonly httpDuration: Histogram<string>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    this.httpRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });
    this.httpDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registry],
    });
  }

  observe(method: string, route: string, status: number, durationSec: number) {
    try {
      const labels = { method, route, status: String(status) };
      this.httpRequests.inc(labels);
      this.httpDuration.observe(labels, durationSec);
    } catch {
      // never throw
    }
  }

  contentType(): string {
    return this.registry.contentType;
  }

  async scrape(): Promise<string> {
    try {
      return await this.registry.metrics();
    } catch {
      return '';
    }
  }
}

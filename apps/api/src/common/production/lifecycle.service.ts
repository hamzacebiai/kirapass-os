import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

/**
 * Startup/shutdown diagnostics. Fail-safe (never throws). Shutdown log fires on
 * SIGINT/SIGTERM via enableShutdownHooks().
 */
@Injectable()
export class LifecycleService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  onApplicationBootstrap(): void {
    try {
      console.log(
        `[LIFECYCLE] ${JSON.stringify({ phase: 'bootstrap', pid: process.pid, node: process.version, ts: new Date().toISOString() })}`,
      );
    } catch {
      // ignore
    }
  }

  onApplicationShutdown(signal?: string): void {
    try {
      console.log(
        `[LIFECYCLE] ${JSON.stringify({ phase: 'shutdown', signal: signal ?? null, uptimeSec: Math.round(process.uptime()), ts: new Date().toISOString() })}`,
      );
    } catch {
      // ignore
    }
  }
}

import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: TenantPrismaService) {}

  // Unchanged (backward compatible).
  @Get()
  check() {
    return {
      status: 'ok',
      system: 'KiraPass OS',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  // Liveness: process is up (no dependency checks).
  @Get('live')
  live() {
    return { status: 'ok', check: 'liveness' };
  }

  // Readiness: dependency check (DB ping). 503 when not ready. Never throws.
  @Get('ready')
  async ready(@Res() res: Response) {
    let db = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }
    res
      .status(db ? 200 : 503)
      .json({ status: db ? 'ok' : 'degraded', check: 'readiness', db });
  }

  // Diagnostics: version / uptime / memory / env (no secrets).
  @Get('info')
  info() {
    const mem = process.memoryUsage();
    const mb = (n: number) => Math.round((n / 1048576) * 100) / 100;
    return {
      system: 'KiraPass OS',
      version: process.env.npm_package_version ?? '1.0.0',
      node: process.version,
      env: process.env.NODE_ENV ?? 'development',
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: { rss: mb(mem.rss), heapUsed: mb(mem.heapUsed) },
      startedAt: new Date(this.startedAt).toISOString(),
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';
import { DiagnosticsGuard } from '../security/diagnostics.guard';

@Controller()
@UseGuards(DiagnosticsGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  // Prometheus scrape endpoint (under the app's global prefix: /api/v1/metrics).
  @Get('metrics')
  async scrape(@Res() res: Response) {
    try {
      res.setHeader('Content-Type', this.metrics.contentType());
      res.send(await this.metrics.scrape());
    } catch {
      res.status(200).send('');
    }
  }
}

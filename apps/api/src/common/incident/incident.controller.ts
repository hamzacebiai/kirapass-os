import { Controller, Post, Get, Param, Body, HttpCode, UseGuards } from '@nestjs/common';
import { IncidentAnalyzer } from './incident.analyzer';
import { IncidentSignal } from './incident.types';
import { DiagnosticsGuard } from '../security/diagnostics.guard';

// Internal diagnostics surface. Guarded by DiagnosticsGuard (platform standard):
// open in non-production, requires x-internal-token in production. This deviates
// from the supplied spec on purpose — without it /_internal/incidents would be
// public and would expose stacks/userIds and trigger billed AI calls.
@Controller('_internal/incidents')
@UseGuards(DiagnosticsGuard)
export class IncidentController {
  constructor(private readonly analyzer: IncidentAnalyzer) {}

  @Post()
  @HttpCode(202)
  async open(@Body() signal: IncidentSignal) {
    return this.analyzer.analyze(signal);
  }

  @Get()
  list() {
    return this.analyzer.getAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.analyzer.getById(id);
  }

  @Post(':id/close')
  @HttpCode(200)
  close(@Param('id') id: string) {
    return this.analyzer.close(id);
  }
}

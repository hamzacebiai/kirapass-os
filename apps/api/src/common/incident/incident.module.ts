import { Module } from '@nestjs/common';
import { IncidentAnalyzer } from './incident.analyzer';
import { IncidentController } from './incident.controller';

@Module({
  providers: [IncidentAnalyzer],
  controllers: [IncidentController],
  exports: [IncidentAnalyzer],
})
export class IncidentModule {}

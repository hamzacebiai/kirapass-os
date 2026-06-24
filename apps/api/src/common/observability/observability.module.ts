import { Global, Module } from '@nestjs/common';
import { RequestLoggerService } from './request-logger.service';
import { ObservabilityController } from './observability.controller';

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [RequestLoggerService],
  exports: [RequestLoggerService],
})
export class ObservabilityModule {}

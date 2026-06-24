import { Controller, Get } from '@nestjs/common';
import { getCorrelationId } from './request-context-ext';

@Controller('observability')
export class ObservabilityController {
  @Get('ping')
  ping() {
    return { ok: true, correlationId: getCorrelationId() ?? null };
  }

  // Diagnostic: forces a 500 to validate the global exception envelope.
  @Get('boom')
  boom() {
    throw new Error('forced failure for observability validation');
  }

  // Diagnostic: artificial ~1200ms delay to validate slow-request logging.
  @Get('slow')
  async slow() {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { ok: true };
  }
}

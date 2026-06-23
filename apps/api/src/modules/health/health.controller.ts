import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      system: 'KiraPass OS',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

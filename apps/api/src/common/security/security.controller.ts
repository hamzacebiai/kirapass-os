import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DiagnosticsGuard } from './diagnostics.guard';

@Controller()
@UseGuards(DiagnosticsGuard)
export class SecurityController {
  @Get('security')
  security(@Req() req: any) {
    return {
      ok: true,
      headers: {
        contentType: req.headers['content-type'] ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    };
  }
}

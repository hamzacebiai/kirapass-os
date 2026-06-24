import { Controller, Get, Req } from '@nestjs/common';

@Controller()
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

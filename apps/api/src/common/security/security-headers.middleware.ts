import { Injectable, NestMiddleware } from '@nestjs/common';

/**
 * Global security headers middleware.
 * Pure additive layer. Never throws. No request modification except headers.
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    try {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '0');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()',
      );
    } catch {
      // fail-safe: never block request
    }
    next();
  }
}

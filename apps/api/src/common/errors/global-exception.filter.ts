import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { getRequestContext } from '../request-context';
import { sanitize } from '../observability/log-sanitizer';
import { ErrorEnvelope } from './error-envelope';

/**
 * Catches ALL exceptions, normalizes into a stable envelope, links to the
 * correlationId + tenant context, logs [ERROR_TRACE], and returns a safe JSON
 * response. Never throws; never leaks stack/internal messages in production.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    try {
      const http = host.switchToHttp();
      const req: any = http.getRequest();
      const res: any = http.getResponse();
      const ctx = getRequestContext();

      const isHttp = exception instanceof HttpException;
      const statusCode = isHttp
        ? (exception as HttpException).getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

      // Derive message + errorCode (safe).
      let httpMessage = 'Error';
      let errorCode = HttpStatus[statusCode] ?? 'HTTP_ERROR';
      if (isHttp) {
        const resp: any = (exception as HttpException).getResponse();
        if (typeof resp === 'string') {
          httpMessage = resp;
        } else if (resp && typeof resp === 'object') {
          httpMessage = Array.isArray(resp.message)
            ? resp.message.join(', ')
            : (resp.message ?? httpMessage);
          if (resp.error) errorCode = resp.error;
        }
      }
      const isProd = process.env.NODE_ENV === 'production';
      const rawMessage =
        exception instanceof Error ? exception.message : 'Unknown error';

      const tier: '4xx' | '5xx' = statusCode >= 500 ? '5xx' : '4xx';
      // Logs may include the real cause (internal); responses must not for 5xx.
      const envelope: ErrorEnvelope = {
        correlationId: ctx?.correlationId ?? req?.correlationId ?? null,
        path: req?.originalUrl ?? req?.url ?? 'unknown',
        method: req?.method ?? 'unknown',
        statusCode,
        errorCode: String(errorCode),
        message: isHttp ? httpMessage : rawMessage,
        timestamp: new Date().toISOString(),
        tier,
        userId: ctx?.userId ?? null,
        agencyId: ctx?.agencyId ?? null,
      };
      if (!isProd && exception instanceof Error && exception.stack) {
        envelope.stack = exception.stack;
      }

      try {
        // eslint-disable-next-line no-console
        console.error(`[ERROR_TRACE] ${JSON.stringify(sanitize(envelope))}`);
      } catch {
        // never block on logging
      }

      if (res && !res.headersSent) {
        res.status(statusCode).json({
          statusCode,
          errorCode: envelope.errorCode,
          message: isHttp ? httpMessage : 'Internal server error',
          correlationId: envelope.correlationId,
          timestamp: envelope.timestamp,
        });
      }
    } catch {
      // Last-resort: never throw out of the filter.
      try {
        const res: any = host.switchToHttp().getResponse();
        if (res && !res.headersSent) {
          res
            .status(500)
            .json({ statusCode: 500, errorCode: 'INTERNAL_ERROR', message: 'Internal server error' });
        }
      } catch {
        // give up silently
      }
    }
  }
}

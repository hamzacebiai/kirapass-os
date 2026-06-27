import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Gate 5: global audit coverage for domain mutations. Emits a persisted
 * `domain.mutation` audit event for every successful mutating request, without
 * touching any domain controller/service. Read methods (GET) are ignored.
 * Fully fail-safe — AuditService.log never throws or blocks the request.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req?.method ?? '';
    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }
    const resource: string =
      req?.route?.path ?? req?.originalUrl ?? req?.url ?? 'unknown';
    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        void this.audit.log({
          eventType: 'domain.mutation',
          action: method,
          resource,
          method,
          statusCode: res?.statusCode,
        });
      }),
    );
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../authz/permissions.enum';
import { permissionsForRole } from '../authz/permissions.map';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuditService } from '../../../common/audit/audit.service';

/**
 * Permission-based authorization. Resolves the JWT role -> permissions via the
 * server-owned matrix and checks the route's required permissions. Permissions
 * are NEVER read from the request; role comes ONLY from the verified JWT.
 * Additive layer above RolesGuard. Use after JwtAuthGuard.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('No identity');
    }
    const granted = permissionsForRole(user.role);
    const ok = required.every((p) => granted.includes(p));
    if (!ok) {
      void this.audit.log({
        eventType: 'auth.rbac.denied',
        action: 'access',
        resource: req.route?.path ?? req.url,
        metadata: { required, role: user.role },
      });
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}

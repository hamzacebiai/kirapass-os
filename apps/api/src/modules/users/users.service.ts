import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: TenantPrismaService,
    private readonly audit: AuditService,
  ) {}

  // agencyId filter is injected automatically by the tenant middleware.
  list() {
    void this.audit.log({
      eventType: 'tenant.access',
      action: 'list',
      resource: 'users',
    });
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        agencyId: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

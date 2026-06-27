import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getRequestContext } from '../request-context';

// Models that carry agencyId and must be tenant-scoped.
const TENANT_MODELS = new Set<string>([
  'User',
  'Property',
  'Unit',
  'Lease',
  'Tenant',
  'RentSchedule',
  'Payment',
]);
// Filter-based actions safe to auto-scope (single update/delete target unique
// ids and are left to explicit checks to avoid where-uniqueness conflicts).
const SCOPED_ACTIONS = new Set<string>([
  'findMany',
  'findFirst',
  'count',
  'aggregate',
  'updateMany',
  'deleteMany',
]);

/**
 * Tenant-aware Prisma client. A global middleware injects
 * `where.agencyId = ctx.agencyId` into every scoped query, derived ONLY from
 * the request context (JWT). SYSTEM_ADMIN bypasses (global view). When there is
 * no authenticated context (public routes), nothing is injected.
 */
@Injectable()
export class TenantPrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    this.$use(async (params, next) => {
      if (params.model && TENANT_MODELS.has(params.model)) {
        const ctx = getRequestContext();
        const enforce =
          ctx && ctx.agencyId && ctx.role !== 'SYSTEM_ADMIN';
        if (enforce && SCOPED_ACTIONS.has(params.action)) {
          params.args = params.args ?? {};
          params.args.where = {
            ...(params.args.where ?? {}),
            agencyId: ctx.agencyId,
          };
        }
      }
      return next(params);
    });
    await this.$connect();
  }
}

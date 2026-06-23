import type { Tenant } from "./domain/tenant.js";
import type { TenantId } from "./domain/value-objects.js";

/**
 * In-memory Tenant repository (no DB yet). Owns load/save of the Tenant
 * aggregate root only. Non-persistent: state resets on process restart.
 * Replaced by a durable implementation when persistence is introduced; the
 * ownership boundary stays the same.
 */
class InMemoryTenantRepository {
  private readonly store = new Map<string, Tenant>();

  save(tenant: Tenant): Tenant {
    this.store.set(tenant.id, tenant);
    return tenant;
  }

  findById(id: TenantId): Tenant | undefined {
    return this.store.get(id);
  }

  findAll(): readonly Tenant[] {
    return [...this.store.values()];
  }
}

export const tenantRepository = new InMemoryTenantRepository();

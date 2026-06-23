import type { Partner } from "./domain/partner.js";
import type { PartnerId } from "./domain/value-objects.js";

/**
 * In-memory Partner repository (no DB yet). Owns load/save of the Partner
 * aggregate root only. Non-persistent: state resets on process restart.
 * Replaced by a durable implementation when persistence is introduced; the
 * ownership boundary stays the same.
 */
class InMemoryPartnerRepository {
  private readonly store = new Map<string, Partner>();

  save(partner: Partner): Partner {
    this.store.set(partner.id, partner);
    return partner;
  }

  findById(id: PartnerId): Partner | undefined {
    return this.store.get(id);
  }

  findAll(): readonly Partner[] {
    return [...this.store.values()];
  }
}

export const partnerRepository = new InMemoryPartnerRepository();

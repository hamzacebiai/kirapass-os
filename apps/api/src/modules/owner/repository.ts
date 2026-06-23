import type { Owner } from "./domain/owner.js";
import type { OwnerId } from "./domain/value-objects.js";

/**
 * In-memory Owner repository (no DB yet). Owns load/save of the Owner aggregate
 * root only. Non-persistent: state resets on process restart. Replaced by a
 * durable implementation when persistence is introduced; ownership boundary
 * stays the same.
 */
class InMemoryOwnerRepository {
  private readonly store = new Map<string, Owner>();

  save(owner: Owner): Owner {
    this.store.set(owner.id, owner);
    return owner;
  }

  findById(id: OwnerId): Owner | undefined {
    return this.store.get(id);
  }

  findAll(): readonly Owner[] {
    return [...this.store.values()];
  }
}

export const ownerRepository = new InMemoryOwnerRepository();

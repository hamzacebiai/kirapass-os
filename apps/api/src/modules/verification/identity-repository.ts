import type { IdentityVerification } from "./domain/identity-verification.js";
import type { IdentityVerificationId } from "./domain/value-objects.js";

/**
 * In-memory IdentityVerification repository (no DB yet). Owns load/save of the
 * IdentityVerification aggregate root only. Non-persistent.
 */
class InMemoryIdentityVerificationRepository {
  private readonly store = new Map<string, IdentityVerification>();

  save(iv: IdentityVerification): IdentityVerification {
    this.store.set(iv.id, iv);
    return iv;
  }

  findById(id: IdentityVerificationId): IdentityVerification | undefined {
    return this.store.get(id);
  }

  findAll(): readonly IdentityVerification[] {
    return [...this.store.values()];
  }
}

export const identityVerificationRepository =
  new InMemoryIdentityVerificationRepository();

import type { PhotoVerification } from "./domain/photo-verification.js";
import type { PhotoVerificationId } from "./domain/value-objects.js";

/**
 * In-memory PhotoVerification repository (no DB yet). Owns load/save of the
 * PhotoVerification aggregate root only. Non-persistent.
 */
class InMemoryPhotoVerificationRepository {
  private readonly store = new Map<string, PhotoVerification>();

  save(pv: PhotoVerification): PhotoVerification {
    this.store.set(pv.id, pv);
    return pv;
  }

  findById(id: PhotoVerificationId): PhotoVerification | undefined {
    return this.store.get(id);
  }

  findAll(): readonly PhotoVerification[] {
    return [...this.store.values()];
  }
}

export const photoVerificationRepository =
  new InMemoryPhotoVerificationRepository();

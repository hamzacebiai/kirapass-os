interface Entry {
  count: number;
  resetAt: number;
}

/**
 * In-memory fixed-window counter. Lazy cleanup: an expired entry is reset on
 * access (no timers). Process-local, no external store.
 */
class RateLimitStore {
  private readonly map = new Map<string, Entry>();

  // Returns true if within limit (allowed), false if exceeded.
  hit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    let entry = this.map.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      this.map.set(key, entry);
    }
    entry.count += 1;
    return entry.count <= limit;
  }

  reset(key: string): void {
    this.map.delete(key);
  }
}

export const rateLimitStore = new RateLimitStore();

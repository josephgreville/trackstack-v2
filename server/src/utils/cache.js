/**
 * A tiny in-process TTL cache. TrackStack only needs to avoid duplicate
 * iTunes calls during a browsing session, so Redis would be unnecessary
 * operational weight.
 */
export class TtlCache {
  constructor({ maxEntries = 250, defaultTtlMs = 60_000 } = {}) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    // Refresh insertion order so the oldest entry is evicted first.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) this.entries.delete(oldestKey);
    }

    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  clear() {
    this.entries.clear();
  }
}

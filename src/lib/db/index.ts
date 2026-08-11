/** Singleton store entry point. Auto-selects Redis vs in-memory backend. */

import { isRedisConfigured } from './redis';
import { MemoryStore } from './store';
import { RedisStore } from './redisStore';
import type { DataStore } from './store';

let cached: DataStore | null = null;

export function getStore(): DataStore {
  if (!cached) {
    cached = isRedisConfigured() ? new RedisStore() : new MemoryStore();
  }
  return cached;
}

export function storeBackend(): 'redis' | 'memory' {
  return isRedisConfigured() ? 'redis' : 'memory';
}

/** Test helper: drop the cached store so the next getStore() call is fresh. */
export function resetStoreForTests(): void {
  cached = null;
}

export { memoryStore } from './store';
export type { DataStore, ListContactsOptions, Paginated, SecurityListOptions, TrackInput } from './store';
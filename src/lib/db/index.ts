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

export { memoryStore } from './store';
export type { DataStore, ListContactsOptions, Paginated, SecurityListOptions, TrackInput } from './store';
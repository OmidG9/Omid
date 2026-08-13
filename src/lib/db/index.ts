/**
 * Singleton store entry point. Auto-selects the backend with the highest
 * priority that is configured:
 *
 *   1. MySQL   — DATABASE_URL is set            (primary, "Database Architecture" prompt)
 *   2. Redis   — UPSTASH_REDIS_REST_* are set   (legacy, keeps setups working)
 *   3. Memory  — local dev / tests
 *
 * Tests are pinned to the in-memory backend so a developer's DATABASE_URL can
 * never leak into a vitest run.
 */

import { isRedisConfigured } from './redis';
import { isMySqlConfigured } from './mysql';
import { MemoryStore } from './store';
import { RedisStore } from './redisStore';
import { MySqlStore } from './mySqlStore';
import type { DataStore } from './store';

let cached: DataStore | null = null;

export type StoreBackend = 'mysql' | 'redis' | 'memory';

function pickBackend(): 'mysql' | 'redis' | 'memory' {
  if (process.env.NODE_ENV !== 'test' && isMySqlConfigured()) return 'mysql';
  if (isRedisConfigured()) return 'redis';
  return 'memory';
}

export function getStore(): DataStore {
  if (!cached) {
    switch (pickBackend()) {
      case 'mysql':
        cached = new MySqlStore();
        break;
      case 'redis':
        cached = new RedisStore();
        break;
      default:
        cached = new MemoryStore();
    }
  }
  return cached;
}

export function storeBackend(): StoreBackend {
  return pickBackend();
}

/** Test helper: drop the cached store so the next getStore() call is fresh. */
export function resetStoreForTests(): void {
  cached = null;
}

export { memoryStore } from './store';
export type { DataStore, ListContactsOptions, Paginated, SecurityListOptions, TrackInput } from './store';
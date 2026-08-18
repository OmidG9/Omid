/**
 * Rate limiter with Upstash Redis sliding-window strategy.
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (local dev),
 * falls back to a simple in-memory Map so the app still works without Redis.
 *
 * Limits are read from admin settings (§24) — defaults: 5 requests per IP per
 * 10-minute window.
 */

import { getSettings } from '@/lib/settings';
import { getRedis } from '@/lib/db/redis';

const MEMORY_RATE_LIMIT_DEFAULT_MAX = 5;
const MEMORY_RATE_LIMIT_DEFAULT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// ─── In-memory fallback ───────────────────────────────────────────────────────

const memoryMap = new Map<string, number[]>();

/** Sweep expired entries so the dev fallback cannot grow unbounded. */
let lastMemorySweep = 0;
function sweepMemory(windowMs: number): void {
  const now = Date.now();
  if (now - lastMemorySweep < 60_000) return; // at most once a minute
  lastMemorySweep = now;
  const cutoff = now - windowMs;
  for (const [ip, hits] of memoryMap) {
    const live = hits.filter((t) => t > cutoff);
    if (live.length === 0) memoryMap.delete(ip);
    else if (live.length !== hits.length) memoryMap.set(ip, live);
  }
}

function checkMemoryLimit(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  sweepMemory(windowMs);
  const windowStart = now - windowMs;
  const hits = (memoryMap.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= max) return true;
  hits.push(now);
  memoryMap.set(ip, hits);
  return false;
}

// ─── Redis sliding-window (sorted set) ───────────────────────────────────────

async function checkRedisLimit(ip: string, max: number, windowMs: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const key = `rl:contact:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const ttlSec = Math.max(60, Math.ceil(windowMs / 1000));

  // Atomic pipeline: remove stale, add current, count, refresh TTL
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, { score: now, member: String(now) });
  pipeline.zcard(key);
  pipeline.expire(key, ttlSec);

  const results = await pipeline.exec();
  const count = results[2] as number;

  return count > max;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns `true` when the given IP has exceeded the rate limit.
 * Uses Redis when env vars are present, in-memory Map otherwise.
 * Thresholds come from the persisted admin settings (§24).
 */
export async function isRateLimited(ip: string): Promise<boolean> {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    settings = null;
  }
  const max = settings?.rateLimitPerIp ?? MEMORY_RATE_LIMIT_DEFAULT_MAX;
  const windowMs = (settings?.rateLimitWindowMin ?? 10) * 60 * 1000;
  const windowMsEffective = windowMs || MEMORY_RATE_LIMIT_DEFAULT_WINDOW_MS;

  try {
    if (getRedis()) {
      return await checkRedisLimit(ip, max, windowMsEffective);
    }
  } catch (err) {
    // Redis failure → fall through to memory limiter so the API stays up
    console.warn('[rateLimiter] Redis error, falling back to memory:', err);
  }
  return checkMemoryLimit(ip, max, windowMsEffective);
}

/** Test helper: clear the in-memory limiter state between test cases. */
export function resetRateLimiterForTests(): void {
  memoryMap.clear();
}
/**
 * Rate limiter with Upstash Redis sliding-window strategy.
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (local dev),
 * falls back to a simple in-memory Map so the app still works without Redis.
 *
 * Buckets are kept separate so normal analytics traffic never exhausts the
 * contact-form or login limits (and vice versa):
 * - `contact`: 5 requests / 10 min per IP (from admin settings §24).
 * - `track`:   200 events / hour per IP — generous for a real visitor.
 * - `login`:   10 attempts / 10 min per IP — slows brute force.
 */

import { getSettings } from '@/lib/settings';
import { getRedis } from '@/lib/db/redis';

export type RateLimitBucket = 'contact' | 'track' | 'login';

const MEMORY_RATE_LIMIT_DEFAULT_MAX = 5;
const MEMORY_RATE_LIMIT_DEFAULT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const BUCKET_DEFAULTS: Record<Exclude<RateLimitBucket, 'contact'>, { max: number; windowMin: number }> = {
  track: { max: 200, windowMin: 60 },
  login: { max: 10, windowMin: 10 },
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const memoryMap = new Map<string, number[]>();

function checkMemoryLimit(ip: string, bucket: RateLimitBucket, max: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const key = `${bucket}:${ip}`;
  const hits = (memoryMap.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= max) return true;
  hits.push(now);
  memoryMap.set(key, hits);
  return false;
}

// ─── Redis sliding-window (sorted set) ───────────────────────────────────────

async function checkRedisLimit(ip: string, bucket: RateLimitBucket, max: number, windowMs: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const key = `rl:${bucket}:${ip}`;
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
 * Returns `true` when the given IP has exceeded the rate limit for a bucket.
 * Uses Redis when env vars are present, in-memory Map otherwise.
 * The `contact` bucket's thresholds come from the persisted admin settings
 * (§24); `track` and `login` use fixed per-bucket budgets.
 */
export async function isRateLimited(ip: string, bucket: RateLimitBucket = 'contact'): Promise<boolean> {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    settings = null;
  }

  let max: number;
  let windowMs: number;
  if (bucket === 'contact') {
    max = settings?.rateLimitPerIp ?? MEMORY_RATE_LIMIT_DEFAULT_MAX;
    const windowMin = settings?.rateLimitWindowMin || 10;
    windowMs = windowMin * 60 * 1000 || MEMORY_RATE_LIMIT_DEFAULT_WINDOW_MS;
  } else {
    const def = BUCKET_DEFAULTS[bucket];
    max = def.max;
    windowMs = def.windowMin * 60 * 1000;
  }

  try {
    if (getRedis()) {
      return await checkRedisLimit(ip, bucket, max, windowMs);
    }
  } catch (err) {
    // Redis failure → fall through to memory limiter so the API stays up
    console.warn('[rateLimiter] Redis error, falling back to memory:', err);
  }
  return checkMemoryLimit(ip, bucket, max, windowMs);
}

/** Test helper: clear the in-memory limiter state between test cases. */
export function resetRateLimiterForTests(): void {
  memoryMap.clear();
}
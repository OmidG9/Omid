/**
 * Rate limiter with Upstash Redis sliding-window strategy.
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (local dev),
 * falls back to a simple in-memory Map so the app still works without Redis.
 *
 * Limit: 5 requests per IP per 10-minute window.
 */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_WINDOW_SEC = 10 * 60; // for Redis TTL

// ─── In-memory fallback ───────────────────────────────────────────────────────

const memoryMap = new Map<string, number[]>();

function checkMemoryLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (memoryMap.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) return true;
  hits.push(now);
  memoryMap.set(ip, hits);
  return false;
}

// ─── Redis sliding-window (sorted set) ───────────────────────────────────────

let redisClient: import('@upstash/redis').Redis | null = null;

function getRedis(): import('@upstash/redis').Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  if (!redisClient) {
    // Lazy import avoids errors when the package is present but env vars are absent
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

async function checkRedisLimit(ip: string): Promise<boolean> {
  const redis = getRedis()!;
  const key = `rl:contact:${ip}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Atomic pipeline: remove stale, add current, count, refresh TTL
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, { score: now, member: String(now) });
  pipeline.zcard(key);
  pipeline.expire(key, RATE_LIMIT_WINDOW_SEC);

  const results = await pipeline.exec();
  const count = results[2] as number;

  return count > RATE_LIMIT_MAX;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns `true` when the given IP has exceeded the rate limit.
 * Uses Redis when env vars are present, in-memory Map otherwise.
 */
export async function isRateLimited(ip: string): Promise<boolean> {
  try {
    if (getRedis()) {
      return await checkRedisLimit(ip);
    }
  } catch (err) {
    // Redis failure → fall through to memory limiter so the API stays up
    console.warn('[rateLimiter] Redis error, falling back to memory:', err);
  }
  return checkMemoryLimit(ip);
}

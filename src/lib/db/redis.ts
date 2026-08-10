/**
 * Singleton Upstash Redis client. Mirrors the lazy pattern already used in
 * src/lib/rateLimiter.ts. Returns null when env vars are absent (local dev
 * falls back to the in-memory store).
 */

import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!client) client = new Redis({ url, token });
  return client;
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function redisPing(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
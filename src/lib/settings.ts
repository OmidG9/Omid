/**
 * Admin settings store (§24, §23).
 *
 * Persists thresholds to Redis (key `ano:settings`) when configured; falls
 * back to an in-memory map so local dev and tests behave identically without
 * a running Redis. Every consumer (rate limiter, spam score, duplicate
 * window, alert generation) reads from here so thresholds are never
 * hard-coded in more than one place.
 */

import { getRedis } from '@/lib/db/redis';

export interface AdminSettings {
  rateLimitPerIp: number;
  rateLimitWindowMin: number;
  duplicateWindowHours: number;
  spamScoreThreshold: number;
  alertTrafficDropPct: number;
  alertFormErrorPct: number;
  alertSpamPct: number;
  retentionDays: {
    events: number;
    sessions: number;
    security: number;
  };
}

export const DEFAULT_SETTINGS: AdminSettings = {
  rateLimitPerIp: 5,
  rateLimitWindowMin: 10,
  duplicateWindowHours: 24,
  spamScoreThreshold: 60,
  alertTrafficDropPct: 50,
  alertFormErrorPct: 5,
  alertSpamPct: 10,
  retentionDays: { events: 90, sessions: 90, security: 90 },
};

const SETTINGS_KEY = 'ano:settings';

let memorySettings: AdminSettings | null = null;

function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(v)));
}

function normalize(input: Partial<AdminSettings> | null | undefined): AdminSettings {
  const base = { ...DEFAULT_SETTINGS };
  const b = input ?? {};
  if (typeof b.rateLimitPerIp === 'number') base.rateLimitPerIp = clampInt(b.rateLimitPerIp, 1, 1000);
  if (typeof b.rateLimitWindowMin === 'number') base.rateLimitWindowMin = clampInt(b.rateLimitWindowMin, 1, 1440);
  if (typeof b.duplicateWindowHours === 'number') base.duplicateWindowHours = clampInt(b.duplicateWindowHours, 1, 720);
  if (typeof b.spamScoreThreshold === 'number') base.spamScoreThreshold = clampInt(b.spamScoreThreshold, 0, 100);
  if (typeof b.alertTrafficDropPct === 'number') base.alertTrafficDropPct = clampInt(b.alertTrafficDropPct, 0, 100);
  if (typeof b.alertFormErrorPct === 'number') base.alertFormErrorPct = clampInt(b.alertFormErrorPct, 0, 100);
  if (typeof b.alertSpamPct === 'number') base.alertSpamPct = clampInt(b.alertSpamPct, 0, 100);
  if (b.retentionDays && typeof b.retentionDays === 'object') {
    const r = b.retentionDays;
    if (typeof r.events === 'number') base.retentionDays.events = clampInt(r.events, 1, 3650);
    if (typeof r.sessions === 'number') base.retentionDays.sessions = clampInt(r.sessions, 1, 3650);
    if (typeof r.security === 'number') base.retentionDays.security = clampInt(r.security, 1, 3650);
  }
  return base;
}

/** Read current settings; merges over defaults so partial Redis values work. */
export async function getSettings(): Promise<AdminSettings> {
  const redis = getRedis();
  if (!redis) {
    return memorySettings ?? { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = await redis.get<string>(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalize(JSON.parse(raw) as Partial<AdminSettings>);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Persist settings (validated/clamped) and return the stored value. */
export async function saveSettings(input: Partial<AdminSettings>): Promise<AdminSettings> {
  const next = normalize({ ...(await getSettings()), ...input });
  const redis = getRedis();
  if (!redis) {
    memorySettings = next;
    return next;
  }
  try {
    await redis.set(SETTINGS_KEY, JSON.stringify(next), { ex: 400 * 86_400 });
  } catch {
    memorySettings = next;
  }
  return next;
}

/** Test helper: clear the in-memory settings between test cases. */
export function resetSettingsForTests(): void {
  memorySettings = null;
}
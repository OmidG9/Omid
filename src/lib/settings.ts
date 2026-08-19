/**
 * Admin settings store (§24, §23).
 *
 * Persists thresholds to the PRIMARY backend, in priority order:
 *   1. MySQL (`admin_setting` table) — when DATABASE_URL is set (production)
 *   2. Redis (key `ano:settings`) — legacy setups without MySQL
 *   3. In-memory map — local dev and tests
 *
 * Every consumer (rate limiter, spam score, duplicate window, alert
 * generation, retention job) reads from here so thresholds are never
 * hard-coded in more than one place.
 */

import { getRedis } from '@/lib/db/redis';
import { getMySqlPool, isMySqlConfigured } from '@/lib/db/mysql';

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

const SETTINGS_KEY = 'settings'; // row key in admin_setting
const REDIS_SETTINGS_KEY = 'ano:settings'; // legacy Redis key

let memorySettings: AdminSettings | null = null;

/** MySQL is the settings backend when it is the primary store (never in tests). */
function mysqlEnabled(): boolean {
  return process.env.NODE_ENV !== 'test' && isMySqlConfigured();
}

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

/** mysql2 returns JSON columns parsed (or a JSON string on some drivers). */
function parseStored(v: unknown): Partial<AdminSettings> | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as Partial<AdminSettings>;
    } catch {
      return null;
    }
  }
  return v as Partial<AdminSettings>;
}

async function getFromMySql(): Promise<AdminSettings | null> {
  try {
    const [rows] = await getMySqlPool().execute(
      'SELECT v FROM `admin_setting` WHERE k = ? LIMIT 1',
      [SETTINGS_KEY]
    );
    const first = (rows as Array<{ v?: unknown }>)[0];
    const parsed = parseStored(first?.v);
    if (parsed) return normalize(parsed);
    return null;
  } catch {
    // table may not exist yet (migrations not applied) — behave as unset
    return null;
  }
}

/** Read current settings; merges over defaults so partial stored values work. */
export async function getSettings(): Promise<AdminSettings> {
  if (mysqlEnabled()) {
    const stored = await getFromMySql();
    if (stored) return stored;
    return { ...DEFAULT_SETTINGS };
  }

  const redis = getRedis();
  if (!redis) {
    return memorySettings ?? { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = await redis.get<string>(REDIS_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalize(JSON.parse(raw) as Partial<AdminSettings>);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Persist settings (validated/clamped) and return the stored value. */
export async function saveSettings(input: Partial<AdminSettings>): Promise<AdminSettings> {
  const next = normalize({ ...(await getSettings()), ...input });

  if (mysqlEnabled()) {
    const json = JSON.stringify(next);
    await getMySqlPool().execute(
      'INSERT INTO `admin_setting` (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = ?',
      [SETTINGS_KEY, json, json]
    );
    return next;
  }

  const redis = getRedis();
  if (!redis) {
    memorySettings = next;
    return next;
  }
  try {
    await redis.set(REDIS_SETTINGS_KEY, JSON.stringify(next), { ex: 400 * 86_400 });
  } catch {
    memorySettings = next;
  }
  return next;
}

/** Test helper: clear the in-memory settings between test cases. */
export function resetSettingsForTests(): void {
  memorySettings = null;
}
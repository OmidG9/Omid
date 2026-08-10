/**
 * GET /api/admin/settings — current thresholds.
 * PATCH — update thresholds with validation.
 *
 * Settings are not persisted (MVP): returned with a `persisted:false` flag.
 * They are validated here so the form can rely on server feedback.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface AdminSettings {
  rateLimitPerIp: number;
  rateLimitWindowMin: number;
  duplicateWindowHours: number;
  spamScoreThreshold: number;
  retentionDays: {
    events: number;
    sessions: number;
    security: number;
  };
}

const DEFAULTS: AdminSettings = {
  rateLimitPerIp: 5,
  rateLimitWindowMin: 10,
  duplicateWindowHours: 24,
  spamScoreThreshold: 60,
  retentionDays: { events: 90, sessions: 90, security: 90 },
};

function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(v)));
}

export async function GET() {
  return NextResponse.json({ ok: true, settings: DEFAULTS, persisted: false });
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const b = (body ?? {}) as Partial<AdminSettings>;

  const next: AdminSettings = { ...DEFAULTS };
  if (typeof b.rateLimitPerIp === 'number') next.rateLimitPerIp = clampInt(b.rateLimitPerIp, 1, 1000);
  if (typeof b.rateLimitWindowMin === 'number') next.rateLimitWindowMin = clampInt(b.rateLimitWindowMin, 1, 1440);
  if (typeof b.duplicateWindowHours === 'number') next.duplicateWindowHours = clampInt(b.duplicateWindowHours, 1, 720);
  if (typeof b.spamScoreThreshold === 'number') next.spamScoreThreshold = clampInt(b.spamScoreThreshold, 0, 100);
  if (b.retentionDays && typeof b.retentionDays === 'object') {
    const r = b.retentionDays;
    if (typeof r.events === 'number') next.retentionDays.events = clampInt(r.events, 1, 3650);
    if (typeof r.sessions === 'number') next.retentionDays.sessions = clampInt(r.sessions, 1, 3650);
    if (typeof r.security === 'number') next.retentionDays.security = clampInt(r.security, 1, 3650);
  }

  return NextResponse.json({ ok: true, settings: next, persisted: false });
}
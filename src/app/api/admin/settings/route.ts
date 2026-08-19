/**
 * GET /api/admin/settings — current thresholds.
 * PATCH — update thresholds, persisted via the settings store (§24).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, type AdminSettings } from '@/lib/settings';

export type { AdminSettings };

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings, persisted: true });
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const settings = await saveSettings((body ?? {}) as Partial<AdminSettings>);
  return NextResponse.json({ ok: true, settings, persisted: true });
}
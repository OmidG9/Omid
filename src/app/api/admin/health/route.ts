/**
 * GET /api/admin/health — system health snapshot for the Settings page (§6.1).
 * Read-only: last analytics event, contact submission, email outcome, Redis ping.
 */

import { NextResponse } from 'next/server';
import { getHealthSnapshot } from '@/lib/services/healthService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getHealthSnapshot();
  return NextResponse.json({ ok: true, ...data });
}
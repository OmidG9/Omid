/**
 * GET /api/admin/analytics/visitors — recent sessions in a date range.
 * Query: ?mode=...&from=&to=&limit=
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVisitors } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const range = parseRange(sp.get('mode'), sp.get('from'), sp.get('to'));
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? 50), 1), 500);
  const sessions = await getVisitors(range, limit);
  return NextResponse.json({ ok: true, items: sessions });
}
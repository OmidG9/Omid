/**
 * GET /api/admin/analytics/overview — dashboard aggregates for a date range.
 * Query: ?mode=today|7|30|90|custom&from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOverview } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const range = parseRange(sp.get('mode'), sp.get('from'), sp.get('to'));
  const data = await getOverview(range);
  return NextResponse.json({ ok: true, ...data });
}
/**
 * GET /api/admin/analytics/pages — top pages for a date range.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSubpage } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const range = parseRange(sp.get('mode'), sp.get('from'), sp.get('to'));
  const data = await getAnalyticsSubpage(range, 'pages');
  return NextResponse.json({ ok: true, ...data });
}
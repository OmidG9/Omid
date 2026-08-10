/**
 * GET /api/admin/analytics/devices — device/browser/OS breakdown for a range.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSubpage } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const range = parseRange(sp.get('mode'), sp.get('from'), sp.get('to'));
  const data = await getAnalyticsSubpage(range, 'devices');
  return NextResponse.json({ ok: true, ...data });
}
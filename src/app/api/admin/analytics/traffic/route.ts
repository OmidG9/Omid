/**
 * GET /api/admin/analytics/traffic — source channel breakdown for a range.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOverview } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const range = parseRange(sp.get('mode'), sp.get('from'), sp.get('to'));
  const overview = await getOverview(range);
  return NextResponse.json({
    ok: true,
    sources: overview.topSources,
    referrers: overview.topReferrers,
  });
}
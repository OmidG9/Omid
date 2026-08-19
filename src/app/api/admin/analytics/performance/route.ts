/**
 * GET /api/admin/analytics/performance — form funnel + health for a range.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPerformance,
  getHealth,
  loadRangeSummary,
} from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const range = parseRange(sp.get('mode'), sp.get('from'), sp.get('to'));
  const rows = await loadRangeSummary(range);
  const [performance, health] = await Promise.all([
    getPerformance(range, rows),
    getHealth(range, rows),
  ]);
  return NextResponse.json({ ok: true, performance, health });
}
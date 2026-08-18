/**
 * GET /api/admin/security/overview — recent security events + type counts.
 * Query: ?from=&to= (epoch ms) &limit=
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const to = Date.now();
  const from = sp.get('from') ? Number(sp.get('from')) : to - 30 * 86_400_000;
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? 100), 1), 500);

  const store = getStore();
  const [events, counts] = await Promise.all([
    store.listSecurityEvents({ from, to, limit }),
    store.countSecurityByType(from, to),
  ]);

  return NextResponse.json({ ok: true, events, counts, from, to });
}
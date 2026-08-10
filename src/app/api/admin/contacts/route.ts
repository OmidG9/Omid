/**
 * GET /api/admin/contacts — paginated, filterable contact list.
 * Query: ?page=1&pageSize=20&status=NEW|READ|REPLIED|ARCHIVED|SPAM|ALL&q=...
 *        &mode=&from=&to=  (createdAt date filter)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { parseRange } from '@/lib/services/rangeParam';
import { CONTACT_STATUS } from '@/types/contacts';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const pageSize = Math.min(Math.max(Number(sp.get('pageSize') ?? 20), 1), 100);

  let status = (sp.get('status') ?? 'ALL') as string;
  if (!['ALL', ...Object.values(CONTACT_STATUS)].includes(status)) status = 'ALL';

  const range = parseRange(sp.get('mode'), sp.get('from'), sp.get('to'));

  const result = await getStore().listContacts({
    page,
    pageSize,
    status: status as never,
    q: sp.get('q') ?? undefined,
    fromKey: range.fromKey,
    toKey: range.toKey,
  });

  return NextResponse.json({ ok: true, ...result });
}
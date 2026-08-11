/**
 * GET /api/admin/contacts/export — CSV download of matching contacts.
 * Shares the same filters as the list endpoint so exports match the current
 * view. Returns Content-Type: text/csv with a BOM for Excel compatibility.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { parseRange } from '@/lib/services/rangeParam';
import { CONTACT_STATUS } from '@/types/contacts';

export const runtime = 'nodejs';

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  let status = (sp.get('status') ?? 'ALL') as string;
  if (!['ALL', ...Object.values(CONTACT_STATUS)].includes(status)) status = 'ALL';

  const range = parseRange(sp.get('mode'), sp.get('from'), sp.get('to'));

  // Fetch all matching rows in pages (export should not truncate).
  const rows = [];
  let page = 1;
  const pageSize = 500;
  for (;;) {
    const result = await getStore().listContacts({
      page,
      pageSize,
      status: status as never,
      q: sp.get('q') ?? undefined,
      fromKey: range.fromKey,
      toKey: range.toKey,
    });
    rows.push(...result.items);
    if (rows.length >= result.total || result.items.length === 0) break;
    page += 1;
  }

  const header = ['وضعیت', 'نام', 'ایمیل', 'موضوع', 'منبع', 'تاریخ ثبت', 'پروژه'];
  const lines = [header.join(',')];
  for (const c of rows) {
    lines.push(
      [
        c.status,
        c.name,
        c.email,
        c.subject,
        c.source,
        new Date(c.createdAt).toISOString(),
        c.projectSlug ?? '',
      ]
        .map(escapeCsv)
        .join(',')
    );
  }

  const body = '\uFEFF' + lines.join('\r\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="contacts.csv"',
    },
  });
}
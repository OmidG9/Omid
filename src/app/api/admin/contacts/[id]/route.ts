/**
 * GET /api/admin/contacts/[id] — single contact detail.
 * PATCH — update status or other mutable fields (status transitions).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { CONTACT_STATUS } from '@/types/contacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const contact = await getStore().getContact(params.id);
  if (!contact) return NextResponse.json({ ok: false, error: 'یافت نشد' }, { status: 404 });
  return NextResponse.json({ ok: true, contact });
}

const statusSchema = (v: unknown) =>
  typeof v === 'string' && (Object.values(CONTACT_STATUS) as string[]).includes(v) ? (v as (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS]) : undefined;

export async function PATCH(request: NextRequest, { params }: Ctx) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const b = (body ?? {}) as { status?: unknown; name?: unknown; subject?: unknown; message?: unknown; email?: unknown };

  const fields: Record<string, unknown> = {};
  const status = statusSchema(b.status);
  if (b.status !== undefined && !status) {
    return NextResponse.json({ ok: false, error: 'وضعیت نامعتبر است' }, { status: 400 });
  }
  if (status) fields.status = status;
  if (typeof b.name === 'string' && b.name.trim()) fields.name = b.name.trim().slice(0, 60);
  if (typeof b.subject === 'string' && b.subject.trim()) fields.subject = b.subject.trim().slice(0, 200);
  if (typeof b.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) fields.email = b.email.trim().slice(0, 120);
  if (typeof b.message === 'string' && b.message.trim()) fields.message = b.message.trim().slice(0, 2000);

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ ok: false, error: 'هیچ فیلدی برای به‌روزرسانی وجود ندارد' }, { status: 400 });
  }

  const updated = await getStore().updateContact(params.id, fields);
  if (!updated) return NextResponse.json({ ok: false, error: 'یافت نشد' }, { status: 404 });
  return NextResponse.json({ ok: true, contact: updated });
}
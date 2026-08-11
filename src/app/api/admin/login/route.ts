/**
 * POST /api/admin/login — verifies password, signs a session cookie.
 * Rate limited by IP to slow brute force. Node runtime (uses Web Crypto,
 * available on Node too).
 */

import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rateLimiter';
import {
  createSessionToken,
  getAdminPassword,
  isAuthConfigured,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  verifyAdminPassword,
} from '@/lib/auth/session';
import { logSecurityEvent } from '@/lib/services/securityService';
import { SECURITY_EVENT } from '@/types/security';
import { z } from 'zod';

export const runtime = 'nodejs';

const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  if (!isAuthConfigured() || !getAdminPassword()) {
    return NextResponse.json(
      { ok: false, error: 'احراز هویت مدیر پیکربندی نشده است. ADMIN_SECRET و ADMIN_PASSWORD را تنظیم کنید.' },
      { status: 500 }
    );
  }

  if (await isRateLimited(ip)) {
    await logSecurityEvent({ type: SECURITY_EVENT.RATE_LIMIT_TRIGGERED, ip, path: '/api/admin/login', reason: 'login rate limit' });
    return NextResponse.json(
      { ok: false, error: 'تعداد تلاش‌ها بیش از حد مجاز است. بعداً دوباره تلاش کنید.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const ok = await verifyAdminPassword(parsed.data.password);
  if (!ok) {
    await logSecurityEvent({ type: SECURITY_EVENT.AUTH_FAILURE, ip, path: '/api/admin/login', reason: 'wrong password' });
    return NextResponse.json({ ok: false, error: 'رمز عبور اشتباه است.' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
}
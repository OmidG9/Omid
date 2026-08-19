/**
 * POST /api/admin/login — verifies username + password against the
 * `admin_user` table (scrypt hash), then signs a session cookie.
 * Rate limited by IP to slow brute force; per-account lockout is handled in
 * authenticateAdmin. Node runtime (uses scrypt via node:crypto).
 */

import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rateLimiter';
import {
  createSessionToken,
  getSigningSecret,
  isAuthConfigured,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from '@/lib/auth/session';
import { authenticateAdmin } from '@/lib/auth/adminCredentials';
import { logSecurityEvent } from '@/lib/services/securityService';
import { SECURITY_EVENT } from '@/types/security';
import { z } from 'zod';

export const runtime = 'nodejs';

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
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

  if (!isAuthConfigured() || !getSigningSecret()) {
    return NextResponse.json(
      { ok: false, error: 'احراز هویت مدیر پیکربندی نشده است. ADMIN_SECRET را تنظیم کنید.' },
      { status: 500 }
    );
  }

  if (await isRateLimited(ip, 'login')) {
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

  const result = await authenticateAdmin(parsed.data.username, parsed.data.password);

  if (!result.ok) {
    if (result.code === 'NOT_CONFIGURED') {
      return NextResponse.json({ ok: false, error: result.message }, { status: 500 });
    }
    await logSecurityEvent({
      type: SECURITY_EVENT.AUTH_FAILURE,
      ip,
      path: '/api/admin/login',
      reason: result.code === 'LOCKED' ? 'account locked' : 'wrong credentials',
    });
    if (result.code === 'LOCKED') {
      return NextResponse.json(
        { ok: false, error: 'حساب به‌طور موقت قفل شده است. بعداً دوباره تلاش کنید.', retryAfterSec: result.retryAfterSec },
        { status: 429 }
      );
    }
    return NextResponse.json({ ok: false, error: 'نام کاربری یا رمز عبور اشتباه است.' }, { status: 401 });
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
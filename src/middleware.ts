/**
 * Edge middleware protecting all /admin/* pages and /api/admin/* routes.
 * Verification is server-side (HMAC) via cookie. Login endpoints are exempt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

const EXEMPT_PATHS = ['/admin/login', '/api/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);

  if (valid) return NextResponse.next();

  const isApi = pathname.startsWith('/api/');
  if (isApi) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  const res = NextResponse.redirect(url);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
/**
 * POST /api/analytics/track — fire-and-forget event ingestion.
 *
 * Normalizes the payload server-side (timestamp, ids), persists via the active
 * store, and returns the ids so the client can store visitor/session cookies.
 * Never fails hard: returns the ids even when persistence errors (already
 * logged inside trackEvent).
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, type TrackRequestPayload, isTrackedPath } from '@/lib/analytics/tracking';
import { isRateLimited } from '@/lib/rateLimiter';
import { logSecurityEvent } from '@/lib/services/securityService';
import { SECURITY_EVENT } from '@/types/security';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

export const runtime = 'nodejs';

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function clientUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') ?? '';
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  // Never track the logged-in admin (their admin_session cookie proves it).
  // The cookie is httpOnly so only the server can make this call (§tracking).
  const adminToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (adminToken && (await verifySessionToken(adminToken))) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Lightly rate-limit tracking to absorb flood/abuse without hurting beacons.
  if (await isRateLimited(ip, 'track')) {
    await logSecurityEvent({
      type: SECURITY_EVENT.RATE_LIMIT_TRIGGERED,
      ip,
      path: '/api/analytics/track',
      reason: 'tracking rate limit',
    });
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: TrackRequestPayload | undefined;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Defense-in-depth: only public landing/project pages are recorded. This also
  // catches stale client queues that were built before path filtering shipped.
  if (!isTrackedPath(body.context?.path)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const result = await trackEvent({
    payload: body,
    userAgent: clientUserAgent(request),
    clientIp: ip,
  });

  if (!result) {
    await logSecurityEvent({
      type: SECURITY_EVENT.INVALID_PAYLOAD,
      ip,
      path: '/api/analytics/track',
      reason: 'unknown event name',
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result });
}
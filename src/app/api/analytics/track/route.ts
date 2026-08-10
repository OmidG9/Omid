/**
 * POST /api/analytics/track — fire-and-forget event ingestion.
 *
 * Normalizes the payload server-side (timestamp, ids), persists via the active
 * store, and returns the ids so the client can store visitor/session cookies.
 * Never fails hard: returns the ids even when persistence errors (already
 * logged inside trackEvent).
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, type TrackRequestPayload } from '@/lib/analytics/tracking';
import { isRateLimited } from '@/lib/rateLimiter';
import { logSecurityEvent } from '@/lib/services/securityService';
import { SECURITY_EVENT } from '@/types/security';

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

  // Lightly rate-limit tracking to absorb flood/abuse without hurting beacons.
  if (await isRateLimited(ip)) {
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
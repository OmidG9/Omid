/**
 * Contact form API route.
 *
 * Pipeline: rate limit → Zod validation → honeypot → persist (store) →
 * spam/duplicate classification → notify → analytics. Persistence outlives
 * email failure; analytics/tracking failures never invalidate requests.
 */

// Force Node.js runtime – required for Nodemailer (no Edge support)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/contactSchema';
import { sendContactEmail } from '@/lib/email';
import { isRateLimited } from '@/lib/rateLimiter';
import { persistContact, appendTimeline } from '@/lib/services/contactService';
import { logSecurityEvent } from '@/lib/services/securityService';
import { SECURITY_EVENT } from '@/types/security';

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Resolve client IP – prefer leftmost entry in x-forwarded-for (real client
  // behind Vercel / Nginx), fall back to x-real-ip, then 'unknown'.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const referrer = request.headers.get('referer');

  // Rate limit (Redis when env vars present, in-memory fallback otherwise)
  if (await isRateLimited(ip)) {
    await logSecurityEvent({
      type: SECURITY_EVENT.RATE_LIMIT_TRIGGERED,
      ip,
      path: '/api/contact',
      reason: 'contact rate limit',
    });
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  // Honeypot check happens BEFORE Zod validation so a filled hidden field is
  // never surfaced to the bot as a validation error (see master prompt §45).
  // The schema deliberately knows nothing about "company" — it is stripped as
  // an unknown key and never stored.
  const raw = (body ?? {}) as Record<string, unknown>;
  const company = typeof raw.company === 'string' ? raw.company : '';
  if (company.length > 0) {
    await logSecurityEvent({
      type: SECURITY_EVENT.SPAM_DETECTED,
      ip,
      path: '/api/contact',
      reason: 'honeypot filled',
    });
    // Silently accept to avoid tipping off bots.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Zod validation
  const result = contactSchema.safeParse(body);
  if (!result.success) {
    await logSecurityEvent({
      type: SECURITY_EVENT.INVALID_PAYLOAD,
      ip,
      path: '/api/contact',
      reason: 'validation failed',
    });
    return NextResponse.json({ ok: false, error: 'Invalid input.' }, { status: 400 });
  }

  const { name, email, message } = result.data;

  // Optional attribution metadata sent by the client SDK (§36–37). All values
  // are re-validated here; they are hints, never trusted blindly.
  const b = (body ?? {}) as Record<string, unknown>;
  const projectSlug =
    typeof b.projectSlug === 'string' && b.projectSlug.trim() ? b.projectSlug.trim().slice(0, 64) : undefined;
  const visitorId = typeof b.visitorId === 'string' && b.visitorId ? b.visitorId.slice(0, 64) : undefined;
  const sessionId = typeof b.sessionId === 'string' && b.sessionId ? b.sessionId.slice(0, 64) : undefined;
  const num = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && v >= min && v <= max ? v : undefined;
  const timeline = {
    arrivedAt: num(b.arrivedAt, 0, Date.now()),
    projectViewedAt: num(b.projectViewedAt, 0, Date.now()),
    openedAt: num(b.openedAt, 0, Date.now()),
    startedAt: num(b.startedAt, 0, Date.now()),
  };

  try {
    // Persist + classify first; persistence outlives SMTP failure.
    const { contact, isDuplicate } = await persistContact({
      name,
      email,
      subject: 'Website contact form',
      message,
      ip,
      userAgent,
      referrer,
      projectSlug,
      visitorId,
      sessionId,
      timeline,
    });

    if (contact.spamScore >= 60 || isDuplicate) {
      await logSecurityEvent({
        type: SECURITY_EVENT.SPAM_DETECTED,
        ip,
        path: '/api/contact',
        reason: `spamScore=${contact.spamScore}${isDuplicate ? ', duplicate' : ''}`,
        meta: { score: contact.spamScore },
      });
    }

    // SMTP send — failures are caught so the request still succeeds when
    // persistence worked; the dashboard keeps the lead either way.
    let emailOk = true;
    try {
      await sendContactEmail({ name, email, message, ip, userAgent });
    } catch (error) {
      emailOk = false;
      console.error('[contact] email send failed (request kept):', error);
    }

    // Timeline: record the send outcome on the stored lead.
    await appendTimeline(contact.id, emailOk);

    return NextResponse.json(
      { ok: true, stored: true, emailSent: emailOk },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
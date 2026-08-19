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
import { trackEvent } from '@/lib/analytics/tracking';
import { getSettings } from '@/lib/settings';
import { SECURITY_EVENT } from '@/types/security';

// ─── Helpers ───────────────────────────────────────────────────────────────

function clientId(body: unknown, key: 'visitorId' | 'sessionId'): string | undefined {
  const b = body as Record<string, unknown> | null;
  return typeof b?.[key] === 'string' && (b[key] as string).length ? (b[key] as string).slice(0, 64) : undefined;
}

/** Record a CONTACT_FORM_ERROR analytics event (server-side, §41/§5.3). */
async function trackFormError(errorType: string, body: unknown): Promise<void> {
  try {
    const visitorId = clientId(body, 'visitorId');
    const sessionId = clientId(body, 'sessionId');
    await trackEvent({
      payload: {
        eventName: 'CONTACT_FORM_ERROR',
        errorType,
        visitorId,
        sessionId,
        context: {},
      },
    });
  } catch {
    // Errors are best-effort; the form submission itself already returned.
  }
}

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  // Rate limit (Redis when env vars present, in-memory fallback otherwise)
  if (await isRateLimited(ip, 'contact')) {
    await logSecurityEvent({
      type: SECURITY_EVENT.RATE_LIMIT_TRIGGERED,
      ip,
      path: '/api/contact',
      reason: 'contact rate limit',
    });
    await trackFormError('RATE_LIMITED', body);
    return NextResponse.json(
      { ok: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.', errorType: 'RATE_LIMITED' },
      { status: 429 }
    );
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
    // Recorded as analytics only (server-side); the bot still sees a silent 200.
    await trackFormError('SPAM_BLOCKED', body);
    return NextResponse.json({ ok: true, stored: false }, { status: 200 });
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
    await trackFormError('VALIDATION_ERROR', body);
    return NextResponse.json(
      { ok: false, error: 'ورودی نامعتبر است.', errorType: 'VALIDATION_ERROR' },
      { status: 400 }
    );
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
    // Thresholds come from persisted settings (§24, §47).
    const settings = await getSettings();
    const { contact, isDuplicate, duplicateOf } = await persistContact({
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
      spamThreshold: settings.spamScoreThreshold,
      duplicateWindowMs: settings.duplicateWindowHours * 60 * 60 * 1000,
    });

    if (isDuplicate) {
      await logSecurityEvent({
        type: SECURITY_EVENT.BLOCKED_REQUEST,
        ip,
        path: '/api/contact',
        reason: 'duplicate submission',
        meta: { score: contact.spamScore },
      });
      await trackFormError('SPAM_BLOCKED', body);
    } else if (contact.spamScore > 0 && contact.spamScore < settings.spamScoreThreshold) {
      await logSecurityEvent({
        type: SECURITY_EVENT.SUSPICIOUS_REQUEST,
        ip,
        path: '/api/contact',
        reason: `spamScore=${contact.spamScore} below threshold`,
        meta: { score: contact.spamScore },
      });
    } else if (contact.spamScore >= settings.spamScoreThreshold || isDuplicate) {
      await logSecurityEvent({
        type: SECURITY_EVENT.SPAM_DETECTED,
        ip,
        path: '/api/contact',
        reason: `spamScore=${contact.spamScore}${isDuplicate ? ', duplicate' : ''}`,
        meta: { score: contact.spamScore },
      });
      await trackFormError('SPAM_BLOCKED', body);
    }

    // SMTP send — failures are caught so the request still succeeds when
    // persistence worked; the dashboard keeps the lead either way.
    let emailOk = true;
    try {
      await sendContactEmail({ name, email, message, ip, userAgent });
    } catch (error) {
      emailOk = false;
      console.error('[contact] email send failed (request kept):', error);
      // §5.3: record EMAIL_ERROR as a form-health signal; the lead is already stored.
      await trackFormError('EMAIL_ERROR', body);
    }

    // Timeline: record the send outcome on the stored lead.
    await appendTimeline(contact.id, emailOk);

    // `spam` lets the client avoid counting blocked leads as funnel success
    // (they are already recorded as SPAM_BLOCKED form errors server-side).
    const isSpam = isDuplicate || contact.spamScore >= settings.spamScoreThreshold;
    return NextResponse.json(
      { ok: true, stored: true, spam: isSpam, emailSent: emailOk },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    await trackFormError('SERVER_ERROR', body);
    return NextResponse.json(
      { ok: false, error: 'ارسال پیام ناموفق بود. لطفاً بعداً دوباره تلاش کنید.', errorType: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
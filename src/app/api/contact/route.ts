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
import { persistContact } from '@/lib/services/contactService';
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

  // Zod validation (includes honeypot field "company")
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

  const { name, email, message, company } = result.data;

  // Honeypot check – bots fill in the hidden "company" field
  if (company && company.length > 0) {
    // Silently accept to avoid tipping off bots
    return NextResponse.json({ ok: true }, { status: 200 });
  }

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
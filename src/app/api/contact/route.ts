/**
 * Contact form API route.
 *
 * Rate limiting: Upstash Redis sliding-window (5 req / 10 min / IP).
 * Falls back to an in-memory limiter when Redis env vars are absent (local dev).
 * See src/lib/rateLimiter.ts for implementation details.
 */

// Force Node.js runtime – required for Nodemailer (no Edge support)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/contactSchema';
import { sendContactEmail } from '@/lib/email';
import { isRateLimited } from '@/lib/rateLimiter';

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Resolve client IP – prefer leftmost entry in x-forwarded-for (real client
    // behind Vercel / Nginx), fall back to x-real-ip, then 'unknown'.
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    // Rate limit (Redis when env vars present, in-memory fallback otherwise)
    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Zod validation (includes honeypot field "company")
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid input.' },
        { status: 400 }
      );
    }

    const { name, email, message, company } = result.data;

    // Honeypot check – bots fill in the hidden "company" field
    if (company && company.length > 0) {
      // Silently accept to avoid tipping off bots
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    await sendContactEmail({ name, email, message, ip, userAgent });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

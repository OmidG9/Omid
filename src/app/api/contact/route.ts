// Force Node.js runtime – required for Nodemailer (no Edge support)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/contactSchema';
import { sendContactEmail } from '@/lib/email';

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// { ip → [timestamp, ...] }
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (rateLimitMap.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) return true;
  hits.push(now);
  rateLimitMap.set(ip, hits);
  return false;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Resolve client IP (works behind Vercel / Nginx reverse proxy)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    // Rate limit
    if (isRateLimited(ip)) {
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

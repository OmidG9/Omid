/**
 * Trusted client-IP resolution.
 *
 * `x-forwarded-for` is spoofable unless the request actually passed through a
 * proxy we control, so we only trust it when running on a platform that
 * overwrites it (Vercel sets `VERCEL=1`) or when the operator explicitly opts
 * in with `TRUST_PROXY=1` (e.g. behind their own nginx). Otherwise we prefer
 * `x-real-ip` (set by nginx) and never trust the raw header — an attacker
 * cannot forge a rate-limit bypass by sending a fake `x-forwarded-for`.
 */
import type { NextRequest } from 'next/server';

const TRUST_XFF =
  process.env.VERCEL === '1' || process.env.TRUST_PROXY === '1';

export function clientIp(request: NextRequest): string {
  if (TRUST_XFF) {
    const xff = request.headers.get('x-forwarded-for');
    const first = xff?.split(',')[0]?.trim();
    if (first) return first;
    return request.headers.get('x-real-ip') ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
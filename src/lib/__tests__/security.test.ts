import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import {
  createSessionToken,
  verifySessionToken,
  verifyAdminPassword,
  getAdminPassword,
} from '@/lib/auth/session';
import {
  isRateLimited,
  resetRateLimiterForTests,
} from '@/lib/rateLimiter';
import { scoreSpam } from '@/lib/services/contactService';
import { resetStoreForTests, getStore } from '@/lib/db';

describe('admin access control', () => {
  it('redirects unauthenticated page requests to /admin/login', async () => {
    const res = await middleware(new NextRequest('http://localhost/admin'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });

  it('returns 401 for unauthenticated /api/admin/* requests', async () => {
    const res = await middleware(new NextRequest('http://localhost/api/admin/settings'));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false });
  });

  it('allows access when a valid session cookie is present', async () => {
    process.env.ADMIN_SECRET = 'test-secret-for-middleware';
    const token = await createSessionToken();
    const res = await middleware(
      new NextRequest('http://localhost/admin', {
        headers: { Cookie: `admin_session=${token}` },
      })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    delete process.env.ADMIN_SECRET;
  });

  it('rejects an invalid session token', async () => {
    const res = await middleware(
      new NextRequest('http://localhost/admin', {
        headers: { Cookie: 'admin_session=not.a.token' },
      })
    );
    expect(res.status).toBe(307);
  });

  it('exempts the login page itself', async () => {
    const res = await middleware(new NextRequest('http://localhost/admin/login'));
    expect(res.status).toBe(200);
  });
});

describe('session tokens', () => {
  it('round-trips create → verify with a configured secret', async () => {
    process.env.ADMIN_SECRET = 'roundtrip-secret';
    const token = await createSessionToken();
    expect(token).toContain('.');
    expect(await verifySessionToken(token)).toBe(true);
    expect(await verifySessionToken('tampered' + token)).toBe(false);
    delete process.env.ADMIN_SECRET;
  });

  it('verifies admin password in constant-time fashion (result-based)', async () => {
    process.env.ADMIN_PASSWORD = 'correct-horse-battery';
    expect(getAdminPassword()).toBe('correct-horse-battery');
    expect(await verifyAdminPassword('correct-horse-battery')).toBe(true);
    expect(await verifyAdminPassword('wrong-password')).toBe(false);
    delete process.env.ADMIN_PASSWORD;
  });
});

describe('rate limiting', () => {
  beforeEach(() => {
    resetRateLimiterForTests();
  });

  it('allows requests below the threshold and blocks beyond it', async () => {
    const ip = '198.51.100.9';
    for (let i = 0; i < 5; i++) {
      expect(await isRateLimited(ip)).toBe(false);
    }
    expect(await isRateLimited(ip)).toBe(true);
  });

  it('treats different IPs independently', async () => {
    const ipA = '198.51.100.1';
    const ipB = '198.51.100.2';
    for (let i = 0; i < 5; i++) await isRateLimited(ipA);
    expect(await isRateLimited(ipA)).toBe(true);
    expect(await isRateLimited(ipB)).toBe(false);
  });
});

describe('spam classification (§47)', () => {
  it('scores a clean submission as 0', () => {
    const { score, flags } = scoreSpam({
      name: 'Ali',
      email: 'ali@example.com',
      message: 'Hi, I would love to talk about a project.',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
    });
    expect(score).toBe(0);
    expect(flags).toEqual([]);
  });

  it('penalises URLs, emoji and bot user agents', () => {
    const { score, flags } = scoreSpam({
      name: 'Bot',
      email: 'bot@example.com',
      message: 'Check https://evil.example.com/buy now 💰 or the offer expires.',
      userAgent: 'curl/8.4.0',
    });
    expect(score).toBeGreaterThan(0);
    expect(flags).toContain('contains-link');
    expect(flags).toContain('suspicious-ua');
  });

  it('never caps credibility: normal users with one link stay below threshold', () => {
    const { score } = scoreSpam({
      name: 'Dev',
      email: 'dev@example.com',
      message: 'Your portfolio is great, I saw it on https://example.com/reference and would like to hire you.',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120',
    });
    expect(score).toBeLessThan(60);
  });
});

describe('security event logging', () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it('records security events without exposing PII', async () => {
    const { logSecurityEvent } = await import('@/lib/services/securityService');
    const { SECURITY_EVENT } = await import('@/types/security');
    await logSecurityEvent({
      type: SECURITY_EVENT.RATE_LIMIT_TRIGGERED,
      ip: '203.0.113.7',
      path: '/api/contact',
      reason: 'rate-limited',
    });
    const events = await getStore().listSecurityEvents({ limit: 10 });
    expect(events.length).toBe(1);
    expect(events[0].type).toBe(SECURITY_EVENT.RATE_LIMIT_TRIGGERED);
    expect(events[0].ip).toBe('203.0.113.7');
    expect(JSON.stringify(events[0])).not.toContain('message-content');
  });
});
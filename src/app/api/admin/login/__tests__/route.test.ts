import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/login/route';
import { resetRateLimiterForTests } from '@/lib/rateLimiter';

vi.mock('@/lib/auth/adminCredentials', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/auth/adminCredentials')>();
  return { ...mod, authenticateAdmin: vi.fn() };
});

import { authenticateAdmin } from '@/lib/auth/adminCredentials';

const mockedAuth = vi.mocked(authenticateAdmin);

function makeRequest(body: unknown, ip = '203.0.113.9'): NextRequest {
  return new NextRequest('http://localhost/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.ADMIN_SECRET = 'test-login-secret';
  resetRateLimiterForTests();
  vi.clearAllMocks();
});

afterEach(() => {
  delete process.env.ADMIN_SECRET;
});

describe('POST /api/admin/login', () => {
  it('returns 400 for invalid payloads', async () => {
    expect((await POST(makeRequest({}))).status).toBe(400);
    expect((await POST(makeRequest({ username: '', password: 'x' }))).status).toBe(400);
    expect((await POST(makeRequest({ username: 'a'.repeat(65), password: 'x' }))).status).toBe(400);
    expect(mockedAuth).not.toHaveBeenCalled();
  });

  it('returns 500 when auth is not configured', async () => {
    delete process.env.ADMIN_SECRET;
    const res = await POST(makeRequest({ username: 'u', password: 'p' }));
    expect(res.status).toBe(500);
  });

  it('returns 401 with a generic message for bad credentials', async () => {
    mockedAuth.mockResolvedValueOnce({ ok: false, code: 'BAD_CREDENTIALS' });
    const res = await POST(makeRequest({ username: 'admin', password: 'wrong' }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('نام کاربری یا رمز عبور');
  });

  it('returns 429 when the account is locked', async () => {
    mockedAuth.mockResolvedValueOnce({ ok: false, code: 'LOCKED', retryAfterSec: 900 });
    const res = await POST(makeRequest({ username: 'admin', password: 'wrong' }));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.retryAfterSec).toBe(900);
  });

  it('sets an httpOnly session cookie on success', async () => {
    mockedAuth.mockResolvedValueOnce({ ok: true, username: 'owner', role: 'admin' });
    const res = await POST(makeRequest({ username: 'owner', password: 'right' }));
    expect(res.status).toBe(200);
    const cookie = res.headers.getSetCookie()[0];
    expect(cookie).toMatch(/^admin_session=/);
    expect(cookie).toContain('HttpOnly');
  });

  it('rate limits repeated attempts by IP (login bucket)', async () => {
    mockedAuth.mockResolvedValue({ ok: false, code: 'BAD_CREDENTIALS' });
    let last = 0;
    for (let i = 0; i < 10; i++) {
      last = (await POST(makeRequest({ username: 'u', password: 'p' }))).status;
    }
    expect(last).toBe(401);
    const blocked = await POST(makeRequest({ username: 'u', password: 'p' }));
    expect(blocked.status).toBe(429);
  });
});
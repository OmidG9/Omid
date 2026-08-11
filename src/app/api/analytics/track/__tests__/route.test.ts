import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/analytics/track/route';
import { getStore, resetStoreForTests } from '@/lib/db';
import { resetRateLimiterForTests } from '@/lib/rateLimiter';
import { isTrackedPath } from '@/lib/analytics/tracking';
import { verifySessionToken } from '@/lib/auth/session';

vi.mock('@/lib/auth/session', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/auth/session')>();
  return { ...mod, verifySessionToken: vi.fn(async () => false) };
});

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/analytics/track', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '198.51.100.7',
      'user-agent': UA,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function viewedPaths(): string[] {
  const store = getStore() as unknown as { debug: { events: Map<string, { context: { path: string } }> } };
  return [...store.debug.events.values()].map((e) => e.context.path);
}

beforeEach(() => {
  resetStoreForTests();
  resetRateLimiterForTests();
  vi.clearAllMocks();
});

describe('POST /api/analytics/track', () => {
  it('records a landing page view', async () => {
    const res = await POST(makeRequest({ eventName: 'PAGE_VIEW', context: { path: '/' } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.eventId).toBeTruthy();
    expect(viewedPaths()).toEqual(['/']);
  });

  it('records a project page view', async () => {
    const res = await POST(
      makeRequest({ eventName: 'PROJECT_VIEW', projectSlug: 'nakhsha', context: { path: '/projects/nakhsha' } })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(viewedPaths()).toContain('/projects/nakhsha');
  });

  it('drops dashboard page views without storing an event', async () => {
    const res = await POST(
      makeRequest({ eventName: 'PAGE_VIEW', context: { path: '/admin/analytics/overview' } })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, ignored: true });
    expect(viewedPaths()).toEqual([]);
  });

  it('drops landing page views from the logged-in admin (admin_session cookie)', async () => {
    vi.mocked(verifySessionToken).mockResolvedValueOnce(true);
    const res = await POST(
      makeRequest(
        { eventName: 'PAGE_VIEW', context: { path: '/' } },
        { cookie: 'admin_session=candidate-token' }
      )
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, ignored: true });
    expect(viewedPaths()).toEqual([]);
  });
});

describe('tracked-path policy', () => {
  it('only admits the landing page and project pages', () => {
    expect(isTrackedPath('/')).toBe(true);
    expect(isTrackedPath('/projects/foo')).toBe(true);
    expect(isTrackedPath('/admin')).toBe(false);
    expect(isTrackedPath('/admin/settings')).toBe(false);
    expect(isTrackedPath('/api/x')).toBe(false);
    expect(isTrackedPath('/files/doc.pdf')).toBe(false);
  });
});
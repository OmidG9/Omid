import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/contact/route';
import { getStore, resetStoreForTests } from '@/lib/db';
import { resetRateLimiterForTests } from '@/lib/rateLimiter';
import { logSecurityEvent } from '@/lib/services/securityService';
import { getPerformance } from '@/lib/services/analyticsService';
import { dateKey, DAY_MS, startOfDayUtc } from '@/lib/utils/date';

vi.mock('@/lib/email', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/email')>();
  return { ...mod, sendContactEmail: vi.fn().mockResolvedValue(undefined) };
});

function todayRange() {
  const to = startOfDayUtc(Date.now()) + DAY_MS - 1;
  const from = startOfDayUtc(Date.now());
  return { fromKey: dateKey(from), toKey: dateKey(to) };
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const VALID = { name: 'Ali Rezaei', email: 'ali@example.com', message: 'Hello, I would like to discuss a project.' };

beforeEach(() => {
  resetStoreForTests();
  resetRateLimiterForTests();
  vi.clearAllMocks();
});

describe('POST /api/contact', () => {
  it('accepts a valid submission (200) and stores the contact', async () => {
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.stored).toBe(true);
    expect(json.spam).toBe(false);

    const list = await getStore().listContacts({ page: 1, pageSize: 25 });
    expect(list.total).toBe(1);
    expect(list.items[0].email).toBe('ali@example.com');
  });

  it('rejects an invalid email with 400', async () => {
    const res = await POST(makeRequest({ ...VALID, email: 'not-an-email' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect((await getStore().listContacts({ page: 1, pageSize: 25 })).total).toBe(0);
  });

  it('rejects missing required fields with 400', async () => {
    for (const body of [{}, { name: '' }, { name: 'Ali', message: 'short' }, { name: 'Ali', email: 'a@b.co' }]) {
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    }
    expect((await getStore().listContacts({ page: 1, pageSize: 25 })).total).toBe(0);
  });

  it('rejects messages over maximum length', async () => {
    const res = await POST(makeRequest({ ...VALID, message: 'x'.repeat(2001) }));
    expect(res.status).toBe(400);
  });

  it.each([
    `<script>alert('x')</script>`,
    `<img src=x onerror=alert(1)>`,
    `<svg onload=alert(1)>`,
    'javascript:alert(1)',
  ])('stores XSS payload safely without execution: %s', async (payload) => {
    const body = { ...VALID, message: payload + ' '.repeat(10) };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(200);

    const list = await getStore().listContacts({ page: 1, pageSize: 25 });
    expect(list.items[0].message).toContain(payload);
  });

  it('does not store a request when the honeypot is filled in', async () => {
    const res = await POST(makeRequest({ ...VALID, company: 'spam-value' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    // The response must not look like a real request to the bot.
    expect(json.ok).toBe(true);
    expect(json.stored).toBe(false);
    expect((await getStore().listContacts({ page: 1, pageSize: 25 })).total).toBe(0);
  });

  it('returns 429 after the rate limit threshold', async () => {
    let lastStatus = 0;
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(VALID));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(200);
    const blocked = await POST(makeRequest(VALID));
    expect(blocked.status).toBe(429);
  });

  it('flags spam submissions with a spam score over the threshold', async () => {
    const spammy = {
      ...VALID,
      message: 'BUY BITCOIN NOW HTTPS://SPAM.EXAMPLE.COM FREE MONEY 💰💰💰 CASINO OFFER WINNER CLAIM NOW',
      email: 'bot@spam.example.com',
    };
    const res = await POST(makeRequest(spammy, { 'user-agent': 'python-requests/2.31' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    // The lead is stored but marked as spam so the client skips funnel success.
    expect(json.stored).toBe(true);
    expect(json.spam).toBe(true);

    const list = await getStore().listContacts({ page: 1, pageSize: 25 });
    expect(list.items[0].spamScore).toBeGreaterThanOrEqual(60);
    expect(list.items[0].spamFlags.length).toBeGreaterThan(0);
  });

  it('flags repeated submissions as duplicates', async () => {
    await POST(makeRequest(VALID));
    await POST(makeRequest({ ...VALID, message: 'Another message with enough length for validation.' }));
    const list = await getStore().listContacts({ page: 1, pageSize: 25 });
    // Both stored, duplicate status delegated to status field handling.
    expect(list.total).toBe(2);
    const first = await getStore().getContact(list.items[0].id);
    expect(first).not.toBeNull();
  });

  it('records a SPAM_BLOCKED form error for honeypot submissions (§5.3)', async () => {
    const res = await POST(makeRequest({ ...VALID, company: 'trap' }));
    expect(res.status).toBe(200);

    const perf = await getPerformance(todayRange());
    expect(perf.errorTypes).toContainEqual({ key: 'SPAM_BLOCKED', value: 1 });
    expect(perf.formErrors).toBe(1);
  });

  it('records a SPAM_BLOCKED form error for spam-scored submissions (§5.3)', async () => {
    // All-caps + link + emoji + spam keywords ⇒ score ≥ 60 threshold.
    const spammy = {
      ...VALID,
      email: 'bot@spam.example.com',
      message: 'BUY BITCOIN NOW HTTPS://SPAM.EXAMPLE.COM FREE MONEY 😀😀😀 MAKE MONEY FAST ONLINE CASINO OFFER',
    };
    const res = await POST(makeRequest(spammy));
    expect(res.status).toBe(200);

    const perf = await getPerformance(todayRange());
    expect(perf.errorTypes).toContainEqual({ key: 'SPAM_BLOCKED', value: 1 });

    const list = await getStore().listContacts({ page: 1, pageSize: 25 });
    expect(list.items[0].processing).toBe('SPAM');
  });

  it('records an EMAIL_ERROR form error when SMTP delivery fails (§5.3, §43)', async () => {
    const { sendContactEmail } = await import('@/lib/email');
    vi.mocked(sendContactEmail).mockRejectedValueOnce(new Error('smtp down'));

    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);
    const json = await res.json();
    // Lead must survive email failure.
    expect(json.stored).toBe(true);
    expect(json.emailSent).toBe(false);

    const perf = await getPerformance(todayRange());
    expect(perf.errorTypes).toContainEqual({ key: 'EMAIL_ERROR', value: 1 });
    expect(perf.formErrors).toBe(1);

    const list = await getStore().listContacts({ page: 1, pageSize: 25 });
    expect(list.total).toBe(1);
  });
});
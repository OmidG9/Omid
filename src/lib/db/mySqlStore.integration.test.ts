/**
 * Integration tests for the real MySQL backend (MySqlStore).
 *
 * These tests require a live MySQL server and are SKIPPED unless
 * TEST_MYSQL_URL is set. They bypass getStore() (which is pinned to memory in
 * vitest) and exercise MySqlStore directly so the exact SQL that ships to
 * production is verified against a real engine.
 *
 *   TEST_MYSQL_URL="mysql://root@127.0.0.1:3307/omid_portfolio" npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MySqlStore } from './mySqlStore';
import { getMySqlPool } from './mysql';
import { trackEvent } from '@/lib/analytics/tracking';
import type { AnalyticsEvent } from '@/types/analytics';
import { dateKey, DAY_MS, startOfDayUtc } from '@/lib/utils/date';
import { SECURITY_EVENT } from '@/types/security';
import { CONTACT_STATUS, CONTACT_TIMELINE_EVENT } from '@/types/contacts';

const URL = process.env.TEST_MYSQL_URL;
const dbUrl = URL ?? 'mysql://root@127.0.0.1:3307/omid_portfolio';

// Configure the pool before any store method runs.
process.env.DATABASE_URL = dbUrl;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36';

async function wipe() {
  const pool = getMySqlPool();
  for (const t of ['contact_duplicate', 'contact', 'security_event', 'analytics_event', 'session', 'visitor']) {
    await pool.execute(`DELETE FROM \`${t}\``);
  }
}

function mkEvent(partial: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'PAGE_VIEW',
    timestamp: Date.now(),
    visitorId: 'v-' + Math.random().toString(36).slice(2, 8),
    sessionId: 's-' + Math.random().toString(36).slice(2, 8),
    context: { path: '/' },
    ...partial,
  } as AnalyticsEvent;
}

describe.skipIf(!URL)('MySqlStore integration (real MySQL)', () => {
  const store = new MySqlStore();
  const today = dateKey(Date.now());

  beforeEach(async () => {
    await wipe();
  });

  it('tracks events, dedupes, and derives correct daily metrics', async () => {
    const base = startOfDayUtc(Date.now());
    const firstPageView = mkEvent({ eventName: 'PAGE_VIEW', visitorId: 'a', sessionId: 's1', timestamp: base + 1000, context: { path: '/' } });
    await store.trackEvent({ event: firstPageView, userAgent: UA });
    await store.trackEvent({ event: mkEvent({ eventName: 'PROJECT_VIEW', visitorId: 'a', sessionId: 's1', timestamp: base + 2000, projectSlug: 'portfolio', context: { path: '/projects/portfolio' } }), userAgent: UA });
    await store.trackEvent({ event: mkEvent({ eventName: 'CONTACT_FORM_VIEW', visitorId: 'b', sessionId: 's2', timestamp: base + 3000, context: { path: '/' } }), userAgent: UA });
    await store.trackEvent({ event: mkEvent({ eventName: 'CONTACT_FORM_START', visitorId: 'b', sessionId: 's2', timestamp: base + 4000, context: { path: '/' } }), userAgent: UA });

    // duplicate of the first event (same eventId) must be ignored
    await store.trackEvent({ event: firstPageView, userAgent: UA });

    const [m] = await store.getDailyMetrics([today]);
    expect(m?.pageViews).toBe(1);
    expect(m?.projectViews).toBe(1);
    expect(m?.formViews).toBe(1);
    expect(m?.formStarts).toBe(1);
    expect(m?.visitors).toBe(2);
    expect(m?.sessions).toBe(2);
    expect(m?.projects).toEqual({ portfolio: 1 });
    expect(m?.pages['/']).toBe(1);
    expect(m?.devices.desktop).toBeGreaterThan(0);

    const vis = await store.getVisitor('a');
    expect(vis?.sessionCount).toBe(1);
    const sess = await store.getSession('s1');
    expect(sess?.pageViews).toBe(1);
    expect(sess?.landingPage).toBe('/');
  });

  it('records a contact, round-trips its timeline, and updates status', async () => {
    await store.recordContact({
      id: 'c1',
      name: 'Ali',
      email: 'ali@example.com',
      subject: 'Website contact form',
      message: 'Hello, let us talk about a project.',
      status: CONTACT_STATUS.NEW,
      processing: 'RECEIVED',
      source: 'direct',
      spamScore: 0,
      spamFlags: [],
      createdAt: Date.now(),
      timeline: [{ name: CONTACT_TIMELINE_EVENT.SUBMITTED_FORM, at: Date.now() }],
    });

    const c = await store.getContact('c1');
    expect(c?.email).toBe('ali@example.com');
    expect(c?.timeline[0].name).toBe('submitted contact form');

    const updated = await store.updateContact('c1', { status: CONTACT_STATUS.REPLIED });
    expect(updated?.status).toBe(CONTACT_STATUS.REPLIED);
    expect((await store.getContact('c1'))?.status).toBe(CONTACT_STATUS.REPLIED);

    const recent = await store.recentContacts(1);
    expect(recent[0].id).toBe('c1');

    const listed = await store.listContacts({ page: 1, pageSize: 10, q: 'ali' });
    expect(listed.total).toBe(1);
    const filtered = await store.listContacts({ page: 1, pageSize: 10, status: 'REPLIED' });
    expect(filtered.total).toBe(1);
    expect((await store.allContactIds(5)).length).toBe(1);
  });

  it('claims duplicates atomically like the Redis contract', async () => {
    const first = await store.claimDuplicate('sha256:abc', 'c1');
    expect(first).toBeNull();
    const second = await store.claimDuplicate('sha256:abc', 'c2');
    expect(second).toBe('c1');
  });

  it('stores and filters security events', async () => {
    await store.recordSecurityEvent({ id: 'e1', type: SECURITY_EVENT.SPAM_DETECTED, at: Date.now(), ip: '1.2.3.4', path: '/api/contact' });
    await store.recordSecurityEvent({ id: 'e2', type: SECURITY_EVENT.AUTH_FAILURE, at: Date.now(), ip: '5.6.7.8' });

    const all = await store.listSecurityEvents({});
    expect(all.length).toBe(2);
    const spamOnly = await store.listSecurityEvents({ types: [SECURITY_EVENT.SPAM_DETECTED] });
    expect(spamOnly.length).toBe(1);
    const counts = await store.countSecurityByType(0, Date.now());
    expect(counts[SECURITY_EVENT.SPAM_DETECTED]).toBe(1);
  });

  it('exposes last-event time and active metric dates', async () => {
    const base = startOfDayUtc(Date.now());
    await store.trackEvent({ event: mkEvent({ eventName: 'PAGE_VIEW', visitorId: 'a', sessionId: 's1', timestamp: base, context: { path: '/' } }), userAgent: UA });
    expect(await store.getLastEventAt()).toBeGreaterThan(0);
    const dates = await store.getActiveMetricDates(dateKey(base - DAY_MS), today);
    expect(dates).toContain(today);
  });
});

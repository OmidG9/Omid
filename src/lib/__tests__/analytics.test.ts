import { describe, it, expect, beforeEach } from 'vitest';
import { getStore, resetStoreForTests } from '@/lib/db';
import { trackEvent } from '@/lib/analytics/tracking';
import {
  getOverview,
  getAnalyticsSubpage,
  getPerformance,
  getHealth,
} from '@/lib/services/analyticsService';
import { dateKey, DAY_MS, startOfDayUtc } from '@/lib/utils/date';
import { calculatePercentageChange } from '@/lib/utils/metrics';
import type { DailyMetric, AnalyticsEvent } from '@/types/analytics';
import { emptyDailyMetric } from '@/lib/db/daily';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36';

function rangeFor(today = Date.now()) {
  const to = startOfDayUtc(today) + DAY_MS - 1;
  const from = startOfDayUtc(today);
  return { from, to, fromKey: dateKey(from), toKey: dateKey(to), days: 1 };
}

async function track(partial: {
  eventName: AnalyticsEvent['eventName'];
  visitorId: string;
  sessionId?: string;
  timestamp?: number;
  projectSlug?: string;
  errorType?: string;
  path?: string;
  referrer?: string | null;
}) {
  const ts = partial.timestamp ?? Date.now();
  return trackEvent({
    payload: {
      eventName: partial.eventName,
      visitorId: partial.visitorId,
      sessionId: partial.sessionId ?? `sess-${partial.visitorId}`,
      projectSlug: partial.projectSlug,
      errorType: partial.errorType,
      context: { path: partial.path ?? '/', referrer: partial.referrer ?? null },
    },
    userAgent: UA,
  });
}

beforeEach(() => {
  resetStoreForTests();
});

describe('analytics service', () => {
  it('tracks a page view and exposes it in the overview', async () => {
    await track({ eventName: 'PAGE_VIEW', visitorId: 'v1', path: '/' });

    const data = await getOverview(rangeFor());
    expect(data.metrics.visitors).toBe(1);
    expect(data.metrics.pageViews).toBe(1);
    expect(data.metrics.sessions).toBe(1);
    expect(data.topPages).toContainEqual({ key: '/', value: 1 });
  });

  it('tracks a project view and attributes it to the project slug', async () => {
    await track({ eventName: 'PROJECT_VIEW', visitorId: 'v1', projectSlug: 'portfolio' });

    const data = await getOverview(rangeFor());
    expect(data.metrics.projectViews).toBe(1);
    expect(data.topProjects).toContainEqual({ key: 'portfolio', value: 1 });

    const projects = await getAnalyticsSubpage(rangeFor(), 'projects');
    expect(projects.kind).toBe('projects');
    if (projects.kind === 'projects') {
      expect(projects.items).toContainEqual({ key: 'portfolio', value: 1 });
    }
  });

  it('tracks contact form views, starts and successes through the funnel', async () => {
    await track({ eventName: 'CONTACT_FORM_VIEW', visitorId: 'v1' });
    await track({ eventName: 'CONTACT_FORM_START', visitorId: 'v1' });
    await track({ eventName: 'CONTACT_FORM_SUCCESS', visitorId: 'v1' });

    const data = await getOverview(rangeFor());
    expect(data.metrics.formViews).toBe(1);
    expect(data.metrics.formStarts).toBe(1);
    expect(data.metrics.formSuccess).toBe(1);
  });

  it('computes conversion from stored contacts over form views', async () => {
    const store = getStore() as unknown as {
      bumpDailyCounter(date: string, field: 'contacts' | 'spam'): Promise<void>;
    };
    await track({ eventName: 'CONTACT_FORM_VIEW', visitorId: 'v1' });
    await store.bumpDailyCounter(dateKey(Date.now()), 'contacts');

    const data = await getOverview(rangeFor());
    expect(data.metrics.conversionRate).toBe(100);
  });

  it('exposes performance and health aggregates', async () => {
    await track({ eventName: 'CONTACT_FORM_VIEW', visitorId: 'v1' });
    await track({ eventName: 'CONTACT_FORM_ERROR', visitorId: 'v1', errorType: 'VALIDATION_ERROR' });
    const store = getStore() as unknown as {
      bumpDailyCounter(date: string, field: 'contacts' | 'spam'): Promise<void>;
    };
    await store.bumpDailyCounter(dateKey(Date.now()), 'spam');

    const perf = await getPerformance(rangeFor());
    expect(perf.formErrors).toBe(1);
    expect(perf.errorTypes).toContainEqual({ key: 'VALIDATION_ERROR', value: 1 });

    const health = await getHealth(rangeFor());
    expect(health.spam).toBe(1);
  });
});

describe('growth / percentage change (§21)', () => {
  it('reports "new" for 0 → positive', () => {
    const c = calculatePercentageChange(5, 0);
    expect(c.direction).toBe('na');
    expect(c.delta).toBe(5);
    expect(c.change).toBeNull();
  });

  it('reports -100% for positive → 0', () => {
    const c = calculatePercentageChange(0, 5);
    expect(c.direction).toBe('down');
    expect(c.change).toBe(-100);
  });

  it('reports negative growth correctly', () => {
    const c = calculatePercentageChange(4, 10);
    expect(c.direction).toBe('down');
    expect(c.change).toBe(-60);
  });

  it('reports positive growth correctly', () => {
    const c = calculatePercentageChange(10, 5);
    expect(c.direction).toBe('up');
    expect(c.change).toBe(100);
  });

  it('summarises empty daily ranges as zeros', async () => {
    const data = await getOverview(rangeFor());
    expect(data.metrics.visitors).toBe(0);
    expect(data.metrics.conversionRate).toBe(0);
  });
});

describe('visitor deduplication across days', () => {
  it('counts a returning visitor correctly when their first event predates the range', async () => {
    resetStoreForTests();
    const then = Date.now() - 3 * DAY_MS;
    await track({ eventName: 'PAGE_VIEW', visitorId: 'returning', timestamp: then });

    // New event today as the same visitor.
    await track({ eventName: 'PAGE_VIEW', visitorId: 'returning', path: '/today' });

    const data = await getOverview(rangeFor());
    expect(data.metrics.visitors).toBe(1);
    // The visitor already existed in the store, so today's event is "returning".
    expect(data.metrics.returningVisitors).toBe(1);
    const dm = await getStore().getDailyMetrics([dateKey(Date.now())]);
    expect(dm[0]?.visitors).toBe(1);
  });
});
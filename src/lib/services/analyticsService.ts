/**
 * Admin analytics service — aggregates store data into dashboard-shaped
 * responses (ARCHITECTURE §8: /api/admin/analytics/*). All methods are async
 * and operate on a resolved DateRange; missing days count as zeros.
 */

import type { DailyMetric, TrafficSeriesPoint } from '@/types/analytics';
import { getStore } from '@/lib/db';
import {
  rangeKeys,
  dateKey,
  DAY_MS,
  startOfDayUtc,
} from '@/lib/utils/date';
import {
  calculatePercentageChange,
  type PercentageChange,
  safeRate,
  topEntries,
} from '@/lib/utils/metrics';
import { shortHost } from '@/lib/analytics/userAgent';
import { formatNumber, SOURCE_LABELS, DEVICE_LABELS } from '@/lib/utils/fa';
import { getSettings } from '@/lib/settings';

export interface OverviewData {
  fromKey: string;
  toKey: string;
  days: number;
  metrics: {
    visitors: number;
    newVisitors: number;
    returningVisitors: number;
    sessions: number;
    pageViews: number;
    projectViews: number;
    outboundClicks: number;
    contacts: number;
    spam: number;
    formViews: number;
    formStarts: number;
    formSubmits: number;
    formSuccess: number;
    formErrors: number;
    bounceRate: number;
    conversionRate: number;
    startRate: number;
    submissionRate: number;
    abandonmentRate: number;
  };
  compare: {
    visitors: PercentageChange;
    pageViews: PercentageChange;
    sessions: PercentageChange;
    contacts: PercentageChange;
    projectViews: PercentageChange;
    conversionRate: PercentageChange;
  };
  previous: {
    visitors: number;
    pageViews: number;
    sessions: number;
    contacts: number;
    projectViews: number;
    conversionRate: number;
  };
  series: TrafficSeriesPoint[];
  dailySummary: Array<{ date: string; visitors: number; sessions: number; pageViews: number }>;
  topPages: Array<{ key: string; value: number }>;
  topProjects: Array<{ key: string; value: number }>;
  topSources: Array<{ key: string; value: number }>;
  topDevices: Array<{ key: string; value: number }>;
  topReferrers: Array<{ key: string; value: number }>;
  insights: string[];
  alerts: string[];
}

/* ── internals ───────────────────────────────────────────────────────── */

function sumDaily(list: Array<DailyMetric | undefined>): DailyMetric {
  const acc: DailyMetric = {
    date: '-',
    visitors: 0,
    newVisitors: 0,
    returningVisitors: 0,
    sessions: 0,
    pageViews: 0,
    projectViews: 0,
    contacts: 0,
    spam: 0,
    outboundClicks: 0,
    formViews: 0,
    formStarts: 0,
    formSuccess: 0,
    formSubmits: 0,
    formErrors: 0,
    projects: {},
    pages: {},
    sources: { direct: 0, search: 0, social: 0, referral: 0, campaign: 0, other: 0 },
    devices: { desktop: 0, mobile: 0, tablet: 0 },
    browsers: {},
    os: {},
    errorTypes: {},
  };
  for (const m of list) {
    if (!m) continue;
    acc.visitors += m.visitors;
    acc.newVisitors += m.newVisitors;
    acc.returningVisitors += m.returningVisitors;
    acc.sessions += m.sessions;
    acc.pageViews += m.pageViews;
    acc.projectViews += m.projectViews;
    acc.contacts += m.contacts;
    acc.spam += m.spam;
    acc.outboundClicks += m.outboundClicks;
    acc.formViews += m.formViews;
    acc.formStarts += m.formStarts;
    acc.formSuccess += m.formSuccess;
    acc.formSubmits += m.formSubmits;
    acc.formErrors += m.formErrors;
    for (const [k, v] of Object.entries(m.pages)) acc.pages[k] = (acc.pages[k] ?? 0) + v;
    for (const [k, v] of Object.entries(m.projects)) acc.projects[k] = (acc.projects[k] ?? 0) + v;
    for (const k of Object.keys(acc.sources)) acc.sources[k as keyof typeof acc.sources] += m.sources[k as keyof typeof acc.sources];
    for (const k of Object.keys(acc.devices)) acc.devices[k as keyof typeof acc.devices] += m.devices[k as keyof typeof acc.devices];
    for (const [k, v] of Object.entries(m.browsers)) acc.browsers[k] = (acc.browsers[k] ?? 0) + v;
    for (const [k, v] of Object.entries(m.os)) acc.os[k] = (acc.os[k] ?? 0) + v;
    for (const [k, v] of Object.entries(m.errorTypes)) acc.errorTypes[k] = (acc.errorTypes[k] ?? 0) + v;
  }
  return acc;
}

async function loadRange(fromKey: string, toKey: string): Promise<DailyMetric[]> {
  const keys = rangeKeys(fromKey, toKey);
  const rows = await getStore().getDailyMetrics(keys);
  return keys.map((k, i) => rows[i] ?? undefined).filter((m): m is DailyMetric => !!m);
}

async function loadRecentReferrers(from: number, to: number): Promise<Array<{ key: string; value: number }>> {
  const sessions = await getStore().listSessions(from, to, 200);
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    if (!s.referrer) continue;
    const host = shortHost(s.referrer);
    if (host === 'direct') continue;
    counts[host] = (counts[host] ?? 0) + 1;
  }
  return topEntries(counts, 5);
}

function averageBounceRate(list: DailyMetric[]): number {
  const total = list.reduce((a, m) => a + m.sessions, 0);
  const bounced = list.reduce((a, m) => a + Math.max(0, m.sessions - m.pageViews), 0);
  return safeRate(bounced, total);
}

/* ── public API ───────────────────────────────────────────────────────── */

/** Loads aggregated daily metrics once so multiple views can share the read. */
export async function loadRangeSummary(range: {
  fromKey: string;
  toKey: string;
}): Promise<DailyMetric[]> {
  return loadRange(range.fromKey, range.toKey);
}

export async function getOverview(range: {
  fromKey: string;
  toKey: string;
  from: number;
  to: number;
  days: number;
}): Promise<OverviewData> {
  const { fromKey, toKey, from, to, days } = range;
  const store = getStore();

  // Previous equivalent-length period ends just before the current start.
  const prevToMs = from - 1;
  const prevToDay = startOfDayUtc(prevToMs - DAY_MS);
  const prevFromDay = prevToDay - (days - 1) * DAY_MS;
  const prevFromKey = dateKey(prevFromDay);
  const prevToKey = dateKey(prevToMs);

  const [cur, prev] = await Promise.all([
    loadRange(fromKey, toKey),
    loadRange(prevFromKey, prevToKey),
  ]);
  const c = sumDaily(cur);
  const p = sumDaily(prev);

  const compare = (current: number, previous: number) => calculatePercentageChange(current, previous);
  const metrics = {
    visitors: c.visitors,
    newVisitors: c.newVisitors,
    returningVisitors: c.returningVisitors,
    sessions: c.sessions,
    pageViews: c.pageViews,
    projectViews: c.projectViews,
    outboundClicks: c.outboundClicks,
    contacts: c.contacts,
    spam: c.spam,
    formViews: c.formViews,
    formStarts: c.formStarts,
    formSuccess: c.formSuccess,
    formSubmits: c.formSubmits,
    formErrors: c.formErrors,
    bounceRate: averageBounceRate(cur),
    conversionRate: safeRate(c.contacts, c.formViews),
    startRate: safeRate(c.formStarts, c.formViews),
    submissionRate: safeRate(c.formSuccess, c.formStarts),
    abandonmentRate: safeRate(Math.max(0, c.formStarts - c.formSuccess), c.formStarts),
  };

  const series: TrafficSeriesPoint[] = rangeKeys(fromKey, toKey).map((k) => {
    const m = cur.find((x) => x.date === k);
    return { date: k, visitors: m?.visitors ?? 0, sessions: m?.sessions ?? 0, pageViews: m?.pageViews ?? 0 };
  });

  const topPages = topEntries(c.pages, 6);
  const topProjects = topEntries(c.projects, 6);
  const topSources = topEntries(c.sources, 6);
  const topDevices = topEntries(c.devices, 3);
  const topReferrers = await loadRecentReferrers(from, to);

  const dailySummary = series.map((s) => ({ ...s }));

  // Insights
  const insights: string[] = [];
  const topSource = topSources[0];
  if (topSource) {
    insights.push(
      `${formatNumber(topSource.value)} بازدید از طریق «${
        SOURCE_LABELS[topSource.key as keyof typeof SOURCE_LABELS] ?? topSource.key
      }» ثبت شد — کانال اصلی این بازه.`
    );
  }
  if (c.returningVisitors > 0) {
    const ratio = Math.round((c.returningVisitors / Math.max(1, c.visitors)) * 100);
    insights.push(`${formatNumber(ratio)}٪ از بازدیدکنندگان در این بازه بازگشتی بوده‌اند.`);
  }
  if (c.projectViews > 0 && c.pageViews > 0) {
    insights.push(`${formatNumber(c.projectViews)} بازدید از پروژه‌های نمونه‌کار ثبت شده است.`);
  }

  // Growth insight (§22): compare visitor volume against the previous period.
  if (c.visitors > 0) {
    if (p.visitors === 0) {
      insights.push('ترافیک این بازه از صفر شروع شده است — دورهٔ قبلی هیچ داده‌ای نداشت.');
    } else {
      const delta = ((c.visitors - p.visitors) / p.visitors) * 100;
      if (Math.abs(delta) >= 5) {
        insights.push(
          `بازدیدکنندگان نسبت به دورهٔ قبل ${delta > 0 ? '' : 'کاهش '}${formatNumber(Math.abs(delta))}٪ ${
            delta > 0 ? 'رشد داشته‌اند.' : 'داشته‌اند.'
          }`
        );
      }
    }
  }

  // Conversion drop (§22): a big drop vs previous period is worth surfacing.
  const convC = safeRate(c.contacts, c.formViews);
  const convP = safeRate(p.contacts, p.formViews);
  if (convP > 0 && convC < convP * 0.5 && c.formViews > 0) {
    insights.push('نرخ تبدیل فرم نسبت به دورهٔ قبل بیش از ۵۰٪ افت کرده است.');
  }

  // Device share (§22): dominant device type if it exceeds half of activity.
  const topDevice = topDevices[0];
  if (topDevice && c.visitors > 0) {
    const share = Math.round((topDevice.value / Math.max(1, c.visitors)) * 100);
    if (share >= 50) {
      insights.push(
        `${formatNumber(share)}٪ از فعالیت بر روی «${
          DEVICE_LABELS[topDevice.key as keyof typeof DEVICE_LABELS] ?? topDevice.key
        }» انجام شده است.`
      );
    }
  }

  // Alerts (§23) — thresholds read from persisted settings.
  const settings = await getSettings();
  const alert = {
    trafficDropPct: settings.alertTrafficDropPct,
    formErrorPct: settings.alertFormErrorPct,
    spamPct: settings.alertSpamPct,
  };
  const alerts: string[] = [];
  if (metrics.spam > 0 && metrics.contacts + metrics.spam > 0) {
    const spamRatio = (metrics.spam / (metrics.contacts + metrics.spam)) * 100;
    if (spamRatio >= alert.spamPct)
      alerts.push(`${formatNumber(Math.round(spamRatio))}٪ از ارسال‌ها به‌عنوان اسپم علامت‌گذاری شده‌اند.`);
  }
  if (metrics.formErrors > 0 && metrics.formViews > 0) {
    const err = (metrics.formErrors / metrics.formViews) * 100;
    if (err >= alert.formErrorPct)
      alerts.push(`نرخ خطای فرم ${formatNumber(Math.round(err))}٪ است — تنظیمات یا SMTP را بررسی کنید.`);
  }
  if (metrics.abandonmentRate >= 60 && metrics.formStarts > 0) {
    alerts.push(`نرخ رهاسازی فرم ${formatNumber(Math.round(metrics.abandonmentRate))}٪ است.`);
  }
  if (c.visitors > 0 && p.visitors > 0 && c.visitors < p.visitors * (1 - alert.trafficDropPct / 100)) {
    alerts.push(`ترافیک نسبت به دورهٔ قبل بیش از ${formatNumber(Math.round(alert.trafficDropPct))}٪ کاهش یافته است.`);
  }
  if (p.visitors > 1 && c.visitors === 0) {
    alerts.push('در این بازه هیچ بازدیدکننده‌ای ثبت نشده است.');
  }

  return {
    fromKey,
    toKey,
    days,
    metrics,
    compare: {
      visitors: compare(c.visitors, p.visitors),
      pageViews: compare(c.pageViews, p.pageViews),
      sessions: compare(c.sessions, p.sessions),
      contacts: compare(c.contacts, p.contacts),
      projectViews: compare(c.projectViews, p.projectViews),
      conversionRate: compare(
        safeRate(c.contacts, c.formViews),
        safeRate(p.contacts, p.formViews)
      ),
    },
    previous: {
      visitors: p.visitors,
      pageViews: p.pageViews,
      sessions: p.sessions,
      contacts: p.contacts,
      projectViews: p.projectViews,
      conversionRate: safeRate(p.contacts, p.formViews),
    },
    series,
    dailySummary,
    topPages,
    topProjects,
    topSources,
    topDevices,
    topReferrers,
    insights,
    alerts,
  };
}

export async function getVisitors(range: { from: number; to: number }, limit = 50) {
  const store = getStore();
  return store.listSessions(range.from, range.to, limit);
}

export type AnalyticsSubpageData =
  | { kind: 'pages'; items: Array<{ key: string; value: number }>; totals: number }
  | { kind: 'projects'; items: Array<{ key: string; value: number }>; totals: number }
  | {
      kind: 'devices';
      items: Array<{ key: string; value: number }>;
      browsers: Array<{ key: string; value: number }>;
      os: Array<{ key: string; value: number }>;
    }
  | { kind: 'traffic'; sources: Array<{ key: string; value: number }> };

export async function getAnalyticsSubpage(
  range: { fromKey: string; toKey: string },
  kind: AnalyticsSubpageData['kind']
): Promise<AnalyticsSubpageData> {
  const rows = await loadRange(range.fromKey, range.toKey);
  const c = sumDaily(rows);
  switch (kind) {
    case 'pages':
      return { kind, items: topEntries(c.pages, 20), totals: c.pageViews };
    case 'projects':
      return { kind, items: topEntries(c.projects, 20), totals: c.projectViews };
    case 'devices':
      return {
        kind,
        items: topEntries(c.devices, 3),
        browsers: topEntries(c.browsers, 10),
        os: topEntries(c.os, 10),
      };
    case 'traffic':
      return { kind, sources: topEntries(c.sources, 6) };
  }
}

export async function getPerformance(range: { fromKey: string; toKey: string }, rows?: DailyMetric[]) {
  const loaded = rows ?? (await loadRange(range.fromKey, range.toKey));
  const c = sumDaily(loaded);
  return {
    formViews: c.formViews,
    formStarts: c.formStarts,
    formSubmits: c.formSubmits,
    formSuccess: c.formSuccess,
    formErrors: c.formErrors,
    conversionRate: safeRate(c.contacts, c.formViews),
    startRate: safeRate(c.formStarts, c.formViews),
    submissionRate: safeRate(c.formSuccess, c.formStarts),
    abandonmentRate: safeRate(Math.max(0, c.formStarts - c.formSuccess), c.formStarts),
    errorTypes: topEntries(c.errorTypes, 10),
  };
}

export async function getHealth(range: { fromKey: string; toKey: string }, rows?: DailyMetric[]) {
  const loaded = rows ?? (await loadRange(range.fromKey, range.toKey));
  const c = sumDaily(loaded);
  return {
    spam: c.spam,
    contacts: c.contacts,
    spamRate: safeRate(c.spam, c.contacts + c.spam),
    outboundClicks: c.outboundClicks,
    formErrors: c.formErrors,
  };
}
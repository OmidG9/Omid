/** DailyMetric factory + merge helpers shared by both storage backends. */

import type { DailyMetric, TrafficSource, DeviceType } from '@/types/analytics';
import { classifySource, detectDevice, detectBrowser, detectOS } from '@/lib/analytics/userAgent';
import type { ViewerContext } from '@/types/analytics';

export function emptyDailyMetric(date: string): DailyMetric {
  return {
    date,
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
    formSubmits: 0,
    formSuccess: 0,
    formErrors: 0,
    projects: {},
    pages: {},
    sources: { direct: 0, search: 0, social: 0, referral: 0, campaign: 0, other: 0 },
    devices: { desktop: 0, mobile: 0, tablet: 0 },
    browsers: {},
    os: {},
    errorTypes: {},
  };
}

export function dailyCounterDelta(
  metric: DailyMetric,
  key: keyof Pick<
    DailyMetric,
    | 'pageViews'
    | 'projectViews'
    | 'contacts'
    | 'spam'
    | 'outboundClicks'
    | 'formViews'
    | 'formStarts'
    | 'formSubmits'
    | 'formSuccess'
    | 'formErrors'
    | 'sessions'
  >,
  by = 1
): void {
  metric[key] += by;
}

export function bumpMap<T extends string>(map: Record<string, number>, key: T | string, by = 1): void {
  const k = String(key);
  map[k] = (map[k] ?? 0) + by;
}

export function bumpSource(map: DailyMetric['sources'], key: TrafficSource): void {
  map[key] += 1;
}

export function bumpDevice(map: DailyMetric['devices'], key: DeviceType): void {
  map[key] += 1;
}

/** Sum a list of daily metrics into a single aggregate. */export function sumDailyMetrics(
  metrics: Array<DailyMetric | undefined>
): DailyMetric {
  const out = emptyDailyMetric('');
  for (const m of metrics) {
    if (!m) continue;
    out.visitors += m.visitors;
    out.newVisitors += m.newVisitors;
    out.returningVisitors += m.returningVisitors;
    out.sessions += m.sessions;
    out.pageViews += m.pageViews;
    out.projectViews += m.projectViews;
    out.contacts += m.contacts;
    out.spam += m.spam;
    out.outboundClicks += m.outboundClicks;
    out.formViews += m.formViews;
    out.formStarts += m.formStarts;
    out.formSubmits += m.formSubmits;
    out.formSuccess += m.formSuccess;
    out.formErrors += m.formErrors;
    for (const [k, v] of Object.entries(m.pages)) bumpMap(out.pages, k, v);
    for (const [k, v] of Object.entries(m.projects)) bumpMap(out.projects, k, v);
    for (const [k, v] of Object.entries(m.browsers)) bumpMap(out.browsers, k, v);
    for (const [k, v] of Object.entries(m.os)) bumpMap(out.os, k, v);
    for (const [k, v] of Object.entries(m.errorTypes)) bumpMap(out.errorTypes, k, v);
    for (const [k, v] of Object.entries(m.sources)) bumpSource(out.sources, k as TrafficSource);
    for (const [k, v] of Object.entries(m.devices)) bumpDevice(out.devices, k as DeviceType);
  }
  return out;
}

/**
 * Declarative increments for the Redis backend so event→metric mapping is
 * defined once and used by the Redis backend (mirrors accumulateMetric).
 */
export interface MetricIncrement {
  hash: 'c' | 'p' | 'pr' | 'src' | 'dev' | 'br' | 'os' | 'err';
  field: string;
}

export function metricIncrementsForEvent(
  eventName: string,
  context: ViewerContext,
  ua: string,
  projectSlug?: string,
  errorType?: string
): MetricIncrement[] {
  const out: MetricIncrement[] = [
    { hash: 'src', field: classifySource(context) },
    { hash: 'dev', field: detectDevice(ua) },
    { hash: 'br', field: detectBrowser(ua) },
    { hash: 'os', field: detectOS(ua) },
  ];
  switch (eventName) {
    case 'PAGE_VIEW':
      out.push({ hash: 'c', field: 'pageViews' }, { hash: 'p', field: context.path || '/' });
      break;
    case 'PROJECT_VIEW':
      out.push({ hash: 'c', field: 'projectViews' }, { hash: 'pr', field: projectSlug || 'unknown' });
      break;
    case 'OUTBOUND_CLICK':
      out.push({ hash: 'c', field: 'outboundClicks' });
      break;
    case 'CONTACT_FORM_VIEW':
      out.push({ hash: 'c', field: 'formViews' });
      break;
    case 'CONTACT_FORM_START':
      out.push({ hash: 'c', field: 'formStarts' });
      break;
    case 'CONTACT_FORM_SUBMIT':
      out.push({ hash: 'c', field: 'formSubmits' });
      break;
    case 'CONTACT_FORM_SUCCESS':
      out.push({ hash: 'c', field: 'formSuccess' });
      break;
    case 'CONTACT_FORM_ERROR':
      out.push({ hash: 'c', field: 'formErrors' }, { hash: 'err', field: errorType || 'UNKNOWN_ERROR' });
      break;
    default:
      break;
  }
  return out;
}
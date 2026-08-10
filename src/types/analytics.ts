/**
 * Analytics domain types.
 *
 * Events form a discriminated union keyed by `eventName`. Every event carries
 * the minimal context needed by the dashboard. Private form content is never
 * stored in analytics events (see src/lib/analytics/tracking.ts).
 */

export const ANALYTICS_EVENT = {
  PAGE_VIEW: 'PAGE_VIEW',
  SESSION_START: 'SESSION_START',
  PROJECT_VIEW: 'PROJECT_VIEW',
  CONTACT_FORM_VIEW: 'CONTACT_FORM_VIEW',
  CONTACT_FORM_START: 'CONTACT_FORM_START',
  CONTACT_FORM_SUBMIT: 'CONTACT_FORM_SUBMIT',
  CONTACT_FORM_SUCCESS: 'CONTACT_FORM_SUCCESS',
  CONTACT_FORM_ERROR: 'CONTACT_FORM_ERROR',
  OUTBOUND_CLICK: 'OUTBOUND_CLICK',
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];

export const DEVICE = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
} as const;

export type DeviceType = (typeof DEVICE)[keyof typeof DEVICE];

export const TRAFFIC_SOURCE = {
  DIRECT: 'direct',
  SEARCH: 'search',
  SOCIAL: 'social',
  REFERRAL: 'referral',
  CAMPAIGN: 'campaign',
  OTHER: 'other',
} as const;

export type TrafficSource =
  (typeof TRAFFIC_SOURCE)[keyof typeof TRAFFIC_SOURCE];

/** Context the client may send. Server recomputes device/browser/os from UA. */
export interface ViewerContext {
  path: string;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  screenWidth?: number | null;
  language?: string | null;
  timezone?: string | null;
  /** Client-measured elapsed ms between form view and submit (server re-checks). */
  formTimeMs?: number | null;
  /** Client-measured elapsed ms between page load and a project view. */
  pageTimeMs?: number | null;
}

export interface BaseEvent {
  eventId: string;
  eventName: AnalyticsEventName;
  /** Server-normalized epoch ms. Client timestamps are never trusted. */
  timestamp: number;
  visitorId: string;
  sessionId: string;
  context: ViewerContext;
}

export type ProjectViewEvent = BaseEvent & { eventName: 'PROJECT_VIEW'; projectSlug: string };
export type ContactErrorEvent = BaseEvent & { eventName: 'CONTACT_FORM_ERROR'; errorType: string };
export type PlainAnalyticsEvent = BaseEvent;

export type AnalyticsEvent =
  | ProjectViewEvent
  | ContactErrorEvent
  | PlainAnalyticsEvent;

export interface VisitorRecord {
  id: string;
  firstSeenAt: number;
  lastSeenAt: number;
  deviceType: DeviceType;
  browser: string;
  os: string;
  language?: string;
  sessionCount: number;
}

export interface SessionRecord {
  id: string;
  visitorId: string;
  startedAt: number;
  lastActivityAt: number;
  endedAt?: number;
  landingPage: string;
  exitPage?: string;
  pageViews: number;
  durationMs: number;
  referrer?: string;
  source: TrafficSource;
  deviceType: DeviceType;
  browser: string;
  os: string;
}

/** Aggregated counters for one calendar day (UTC). */
export interface DailyMetric {
  date: string; // YYYY-MM-DD (UTC)
  visitors: number;
  newVisitors: number;
  returningVisitors: number;
  sessions: number;
  pageViews: number;
  projectViews: number;
  contacts: number;
  spam: number;
  outboundClicks: number;
  formViews: number;
  formStarts: number;
  formSuccess: number;
  formErrors: number;
  projects: Record<string, number>;
  pages: Record<string, number>;
  sources: Record<TrafficSource, number>;
  devices: Record<DeviceType, number>;
  browsers: Record<string, number>;
  os: Record<string, number>;
  errorTypes: Record<string, number>;
}

export interface TrafficSeriesPoint {
  date: string;
  visitors: number;
  sessions: number;
  pageViews: number;
}
/**
 * Tracking orchestration service.
 *
 * Turns a raw client payload into a normalized AnalyticsEvent (server-provided
 * timestamp and ids) and persists it via the active store. Never throws: an
 * analytics failure must not break the public site. Returns generated ids so the
 * caller can persist them as cookies.
 */

import { ANALYTICS_EVENT } from '@/types/analytics';
import type {
  AnalyticsEvent,
  AnalyticsEventName,
  ViewerContext,
} from '@/types/analytics';
import { getStore } from '@/lib/db';

const MAX_WIDTH = 10_000; // arbitrary, just bounds junk input

export interface TrackRequestPayload {
  visitorId?: string;
  sessionId?: string;
  eventName?: string;
  projectSlug?: string;
  errorType?: string;
  context?: Partial<ViewerContext>;
}

export interface TrackResult {
  eventId: string;
  visitorId: string;
  sessionId: string;
}

export interface TrackServiceInput {
  payload: TrackRequestPayload;
  userAgent?: string;
  clientIp?: string;
}

function sanitizeViewerContext(ctx: Partial<ViewerContext> | undefined): ViewerContext {
  const c = ctx ?? {};
  const s = (v: unknown): string | null | undefined =>
    typeof v === 'string' && v.length ? v.slice(0, 2048) : null;
  return {
    path: s(c.path) ?? '/',
    referrer: s(c.referrer),
    utmSource: s(c.utmSource),
    utmMedium: s(c.utmMedium),
    utmCampaign: s(c.utmCampaign),
    utmTerm: s(c.utmTerm),
    utmContent: s(c.utmContent),
    screenWidth:
      typeof c.screenWidth === 'number' && c.screenWidth > 0 && c.screenWidth <= MAX_WIDTH
        ? c.screenWidth
        : undefined,
    language: s(c.language),
    timezone: s(c.timezone),
    formTimeMs:
      typeof c.formTimeMs === 'number' && c.formTimeMs >= 0 && c.formTimeMs <= 86_400_000
        ? c.formTimeMs
        : null,
    pageTimeMs:
      typeof c.pageTimeMs === 'number' && c.pageTimeMs >= 0 && c.pageTimeMs <= 86_400_000
        ? c.pageTimeMs
        : null,
  };
}

export function buildEvent(payload: TrackRequestPayload): AnalyticsEvent | null {
  const name = payload.eventName as AnalyticsEventName | undefined;
  if (!name || !(name in ANALYTICS_EVENT)) return null;

  const base = {
    eventId: crypto.randomUUID(),
    eventName: name,
    timestamp: Date.now(),
    visitorId: payload.visitorId ?? crypto.randomUUID(),
    sessionId: payload.sessionId ?? crypto.randomUUID(),
    context: sanitizeViewerContext(payload.context),
  };

  if (name === 'PROJECT_VIEW') {
    return {
      ...base,
      eventName: 'PROJECT_VIEW',
      projectSlug:
        typeof payload.projectSlug === 'string' && payload.projectSlug
          ? payload.projectSlug.slice(0, 64)
          : 'unknown',
    };
  }
  if (name === 'CONTACT_FORM_ERROR') {
    return {
      ...base,
      eventName: 'CONTACT_FORM_ERROR',
      errorType:
        typeof payload.errorType === 'string' && payload.errorType
          ? payload.errorType.slice(0, 32)
          : 'UNKNOWN_ERROR',
    };
  }
  return base;
}

export async function trackEvent(input: TrackServiceInput): Promise<TrackResult | null> {
  const event = buildEvent(input.payload);
  if (!event) return null;
  try {
    await getStore().trackEvent({
      event,
      userAgent: input.userAgent,
      clientIp: input.clientIp,
    });
  } catch (error) {
    // Analytics must never break the public site.
    console.error('[analytics] failed to record event:', error);
  }
  return {
    eventId: event.eventId,
    visitorId: event.visitorId,
    sessionId: event.sessionId,
  };
}
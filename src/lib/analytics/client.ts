/**
 * Client tracking SDK — fire-and-forget, beacon-based.
 *
 * Manages anonymous visitor/session ids in cookies (no fingerprinting) and
 * sends events to /api/analytics/track. Failures are swallowed: analytics must
 * never affect the public site. Also exposes form-funnel helpers.
 *
 * SSR-safe: window/visibility guarded.
 */

import type { AnalyticsEventName, ViewerContext } from '@/types/analytics';

const VISITOR_COOKIE = 'ano_vid';
const SESSION_COOKIE = 'ano_sid';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30-minute inactivity timeout
const QUEUE_KEY = 'ano_queue';
const QUEUE_LIMIT = 32;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSec: number): void {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax${secure}`;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedVisitor: string | null = null;
let cachedSession: string | null = null;
let sessionTouchedAt = 0;
let initialized = false;

function ensureSession(): string {
  const now = Date.now();
  if (cachedSession && now - sessionTouchedAt < SESSION_TTL_MS) return cachedSession;
  cachedSession = getCookie(SESSION_COOKIE) ?? uuid();
  sessionTouchedAt = now;
  setCookie(SESSION_COOKIE, cachedSession, 60 * 60 * 24 * 90);
  return cachedSession;
}

function ensureVisitor(): string {
  if (cachedVisitor) return cachedVisitor;
  cachedVisitor = getCookie(VISITOR_COOKIE) ?? uuid();
  setCookie(VISITOR_COOKIE, cachedVisitor, 60 * 60 * 24 * 365);
  return cachedVisitor;
}

function pushQueued(payload: Record<string, unknown>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue: Array<Record<string, unknown>> = raw ? JSON.parse(raw) : [];
    queue.push(payload);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-QUEUE_LIMIT)));
  } catch {
    // storage unavailable — drop
  }
}

function flushQueue(): void {
  if (typeof localStorage === 'undefined') return;
  let queue: Array<Record<string, unknown>> = [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    queue = JSON.parse(raw);
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    return;
  }
  queue.forEach((p) => send(p as Record<string, string>));
}

function send(body: Record<string, unknown>): void {
  if (typeof navigator === 'undefined') return;
  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        '/api/analytics/track',
        new Blob([JSON.stringify(body)], { type: 'application/json' })
      );
      if (!ok) pushQueued(body);
      return;
    }
    const req = fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    req.catch(() => pushQueued(body));
  } catch {
    pushQueued(body);
  }
}

function trackBase(eventName: AnalyticsEventName, extra: Record<string, unknown>, context: Partial<ViewerContext>): void {
  const body = {
    visitorId: ensureVisitor(),
    sessionId: ensureSession(),
    eventName,
    context: {
      path: location.pathname,
      referrer: document.referrer || null,
      screenWidth: window.screen?.width ?? null,
      language: navigator.language || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      ...context,
    },
    ...extra,
  };
  send(body);
}

function utmParams(): Record<string, string | null> {
  if (typeof location === 'undefined') return {};
  const q = new URLSearchParams(location.search);
  const out: Record<string, string | null> = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = q.get(k);
    out[k.replace('utm_', 'utm')] = v;
  }
  return out;
}

export const analytics = {
  init(): void {
    if (typeof window === 'undefined') return;
    if (initialized) return;
    initialized = true;
    flushQueue();
    // Page view on load.
    this.pageView();
  },

  /** Current anonymous visitor/session ids (used to attribute contact leads). */
  identity(): { visitorId: string; sessionId: string } {
    return { visitorId: ensureVisitor(), sessionId: ensureSession() };
  },

  pageView(): void {
    trackBase('PAGE_VIEW', {}, utmParams());
  },

  projectView(projectSlug: string, opts?: { pageTimeMs?: number }): void {
    trackBase('PROJECT_VIEW', { projectSlug }, { pageTimeMs: opts?.pageTimeMs ?? null });
  },

  outboundClick(): void {
    trackBase('OUTBOUND_CLICK', {}, {});
  },

  formView(opts?: { formTimeMs?: number }): void {
    trackBase('CONTACT_FORM_VIEW', {}, { formTimeMs: opts?.formTimeMs ?? null });
  },

  formStart(opts?: { formTimeMs?: number }): void {
    trackBase('CONTACT_FORM_START', {}, { formTimeMs: opts?.formTimeMs ?? null });
  },

  formSuccess(opts?: { formTimeMs?: number }): void {
    trackBase('CONTACT_FORM_SUCCESS', {}, { formTimeMs: opts?.formTimeMs ?? null });
  },

  formError(errorType: string, opts?: { formTimeMs?: number }): void {
    trackBase('CONTACT_FORM_ERROR', { errorType }, { formTimeMs: opts?.formTimeMs ?? null });
  },
};

/** Auto-init when the module loads in a browser context. */
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    analytics.init();
  } else {
    window.addEventListener('DOMContentLoaded', () => analytics.init());
  }
}

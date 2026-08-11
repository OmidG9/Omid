/**
 * Storage backend interface + in-memory implementation.
 *
 * The Redis backend is used in production (when env vars are present); the
 * memory backend keeps local dev and tests fully functional without Redis.
 * Both must behave identically.
 */

import type {
  AnalyticsEvent,
  DailyMetric,
  SessionRecord,
  VisitorRecord,
} from '@/types/analytics';
import type { ContactRequest, ContactStatus } from '@/types/contacts';
import type { SecurityEvent, SecurityEventType } from '@/types/security';
import { emptyDailyMetric, bumpMap, bumpSource, bumpDevice, dailyCounterDelta } from './daily';
import { dateKey } from '@/lib/utils/date';
import { detectDevice, detectBrowser, detectOS, classifySource } from '@/lib/analytics/userAgent';

export interface ListContactsOptions {
  fromKey?: string;
  toKey?: string;
  status?: ContactStatus | 'ALL';
  q?: string;
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SecurityListOptions {
  types?: SecurityEventType[];
  from?: number;
  to?: number;
  limit?: number;
}

export interface TrackInput {
  event: AnalyticsEvent;
  userAgent?: string;
  clientIp?: string;
}

/**
 * Low-level storage contract. High-level orchestration lives in track.ts and
 * the service layer; backends only implement persistence primitives.
 */
export interface DataStore {
  trackEvent(input: TrackInput): Promise<void>;
  recordContact(contact: ContactRequest): Promise<void>;
  /**
   * Atomically claim a duplicate hash; stores the submitting contact id and
   * returns the id of the *prior* submission when a duplicate exists, or null
   * when this claim won (§50).
   */
  claimDuplicate(hash: string, contactId: string, ttlSec?: number): Promise<string | null>;
  recordSecurityEvent(ev: SecurityEvent): Promise<void>;
  /** Increment a scalar daily counter (contacts, spam) for a date key. */
  bumpDailyCounter(date: string, field: 'contacts' | 'spam', by?: number): Promise<void>;

  getVisitor(vid: string): Promise<VisitorRecord | null>;
  getSession(sid: string): Promise<SessionRecord | null>;
  getDailyMetrics(keys: string[]): Promise<Array<DailyMetric | undefined>>;
  getActiveMetricDates(fromKey: string, toKey: string): Promise<string[]>;
  listSessions(from: number, to: number, limit: number): Promise<SessionRecord[]>;
  /** Timestamp of the most recently received analytics event (or 0). */
  getLastEventAt(): Promise<number>;

  getContact(id: string): Promise<ContactRequest | null>;
  listContacts(opts: ListContactsOptions): Promise<Paginated<ContactRequest>>;
  recentContacts(limit: number): Promise<ContactRequest[]>;
  allContactIds(limit?: number): Promise<string[]>;
  updateContact(id: string, fields: Partial<ContactRequest>): Promise<ContactRequest | null>;

  listSecurityEvents(opts: SecurityListOptions): Promise<SecurityEvent[]>;
  countSecurityByType(from: number, to: number): Promise<Record<string, number>>;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Shared event accumulation logic (used by both backends)
 * ─────────────────────────────────────────────────────────────────────────── */

export interface AccumulateResult {
  isNewVisitor: boolean;
  visitorCreated: boolean;
}

export function accumulateMetric(
  day: DailyMetric,
  input: TrackInput
): void {
  const { event } = input;
  const ua = input.userAgent ?? '';

  bumpSource(day.sources, classifySource(event.context));
  bumpDevice(day.devices, detectDevice(ua));
  bumpMap(day.browsers, detectBrowser(ua));
  bumpMap(day.os, detectOS(ua));

  switch (event.eventName) {
    case 'PAGE_VIEW':
      dailyCounterDelta(day, 'pageViews');
      bumpMap(day.pages, event.context.path || '/');
      break;
    case 'PROJECT_VIEW':
      dailyCounterDelta(day, 'projectViews');
      bumpMap(day.projects, (event as { projectSlug: string }).projectSlug || 'unknown');
      break;
    case 'OUTBOUND_CLICK':
      dailyCounterDelta(day, 'outboundClicks');
      break;
    case 'CONTACT_FORM_VIEW':
      dailyCounterDelta(day, 'formViews');
      break;
    case 'CONTACT_FORM_START':
      dailyCounterDelta(day, 'formStarts');
      break;
    case 'CONTACT_FORM_SUBMIT':
      dailyCounterDelta(day, 'formSubmits');
      break;
    case 'CONTACT_FORM_SUCCESS':
      dailyCounterDelta(day, 'formSuccess');
      break;
    case 'CONTACT_FORM_ERROR':
      dailyCounterDelta(day, 'formErrors');
      bumpMap(day.errorTypes, (event as { errorType: string }).errorType || 'UNKNOWN_ERROR');
      break;
    default:
      break;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * In-memory backend (local dev / tests)
 * ─────────────────────────────────────────────────────────────────────────── */

interface MemoryShape {
  events: Map<string, AnalyticsEvent>;
  visitors: Map<string, VisitorRecord>;
  sessions: Map<string, SessionRecord>;
  daily: Map<string, DailyMetric>;
  dailyIndex: Set<string>;
  daySessions: Map<string, Set<string>>;
  dayVisitors: Map<string, Set<string>>;
  dayNew: Map<string, Set<string>>;
  dayRet: Map<string, Set<string>>;
  contacts: Map<string, ContactRequest>;
  /** Most recent analytics event timestamp (for health checks). */
  lastEventAt: number;
  contactSorted: Map<number, Set<string>>; // createdAt -> ids
  contactStatus: Map<ContactStatus, Set<string>>;
  duplicateHashes: Map<string, string>;
  security: Map<string, SecurityEvent>;
  securitySorted: Map<number, string>;
  securityByType: Map<SecurityEventType, Set<string>>;
}

export class MemoryStore implements DataStore {
  private shape: MemoryShape = {
    events: new Map(),
    visitors: new Map(),
    sessions: new Map(),
    daily: new Map(),
    dailyIndex: new Set(),
    daySessions: new Map(),
    dayVisitors: new Map(),
    dayNew: new Map(),
    dayRet: new Map(),
    contacts: new Map(),
    lastEventAt: 0,
    contactSorted: new Map(),
    contactStatus: new Map(),
    duplicateHashes: new Map(),
    security: new Map(),
    securitySorted: new Map(),
    securityByType: new Map(),
  };

  get debug(): MemoryShape {
    return this.shape;
  }

  async trackEvent(input: TrackInput): Promise<void> {
    const { event } = input;
    if (this.shape.events.has(event.eventId)) return; // dedupe
    this.shape.events.set(event.eventId, event);
    this.shape.lastEventAt = Math.max(this.shape.lastEventAt, event.timestamp);

    const dayKey = dateKey(event.timestamp);
    let day = this.shape.daily.get(dayKey);
    if (!day) {
      day = emptyDailyMetric(dayKey);
      this.shape.daily.set(dayKey, day);
      this.shape.dailyIndex.add(dayKey);
    }

    const ua = input.userAgent ?? '';
    const device = detectDevice(ua);
    const browser = detectBrowser(ua);
    const os = detectOS(ua);

    // visitor
    const existing = this.shape.visitors.get(event.visitorId);
    let visitorRecord = existing ?? null;
    const isNewVisitor = !existing;
    if (!visitorRecord) {
      visitorRecord = {
        id: event.visitorId,
        firstSeenAt: event.timestamp,
        lastSeenAt: event.timestamp,
        deviceType: device,
        browser,
        os,
        language: event.context.language ?? undefined,
        sessionCount: 0,
      };
      this.shape.visitors.set(event.visitorId, visitorRecord);
    } else {
      visitorRecord.lastSeenAt = event.timestamp;
      this.shape.visitors.set(event.visitorId, visitorRecord);
    }

    // per-day visitor sets (mirrors Redis scard(dmNew)/scard(dmRet))
    const dayVisitors = this.shape.dayVisitors.get(dayKey) ?? new Set<string>();
    dayVisitors.add(event.visitorId);
    this.shape.dayVisitors.set(dayKey, dayVisitors);
    const daySet = (isNewVisitor ? this.shape.dayNew : this.shape.dayRet).get(dayKey) ?? new Set<string>();
    daySet.add(event.visitorId);
    (isNewVisitor ? this.shape.dayNew : this.shape.dayRet).set(dayKey, daySet);
    day.visitors = dayVisitors.size;
    day.newVisitors = this.shape.dayNew.get(dayKey)?.size ?? 0;
    day.returningVisitors = this.shape.dayRet.get(dayKey)?.size ?? 0;

    // session
    let session = this.shape.sessions.get(event.sessionId);
    if (!session) {
      session = {
        id: event.sessionId,
        visitorId: event.visitorId,
        startedAt: event.timestamp,
        lastActivityAt: event.timestamp,
        landingPage: event.context.path,
        pageViews: 0,
        durationMs: 0,
        referrer: event.context.referrer ?? undefined,
        source: classifySource(event.context),
        deviceType: device,
        browser,
        os,
      };
      this.shape.sessions.set(event.sessionId, session);
      visitorRecord.sessionCount += 1;
      this.shape.visitors.set(event.visitorId, visitorRecord);
      // count the session toward the day it started on
      const startDay = dateKey(session.startedAt);
      const daySet = this.shape.daySessions.get(startDay) ?? new Set<string>();
      daySet.add(session.id);
      this.shape.daySessions.set(startDay, daySet);
    }
    session.lastActivityAt = event.timestamp;
    session.exitPage = event.context.path;
    session.durationMs = session.lastActivityAt - session.startedAt;
    if (event.eventName === 'PAGE_VIEW') session.pageViews += 1;

    // day-level session count (deduped via daySessions set)
    const todaySet = this.shape.daySessions.get(dayKey);
    if (todaySet) day.sessions = todaySet.size;

    accumulateMetric(day, input);
  }

  async recordContact(contact: ContactRequest): Promise<void> {
    this.shape.contacts.set(contact.id, contact);
    const statusSet = this.shape.contactStatus.get(contact.status) ?? new Set<string>();
    statusSet.add(contact.id);
    this.shape.contactStatus.set(contact.status, statusSet);
    const ts = this.shape.contactSorted.get(contact.createdAt) ?? new Set<string>();
    ts.add(contact.id);
    this.shape.contactSorted.set(contact.createdAt, ts);
  }

  async claimDuplicate(hash: string, contactId: string, _ttlSec?: number): Promise<string | null> {
    const existing = this.shape.duplicateHashes.get(hash);
    if (existing) return existing;
    this.shape.duplicateHashes.set(hash, contactId);
    return null;
  }

  async recordSecurityEvent(ev: SecurityEvent): Promise<void> {
    this.shape.security.set(ev.id, ev);
    this.shape.securitySorted.set(ev.at, ev.id);
    const byType = this.shape.securityByType.get(ev.type) ?? new Set<string>();
    byType.add(ev.id);
    this.shape.securityByType.set(ev.type, byType);
  }

  async bumpDailyCounter(date: string, field: 'contacts' | 'spam', by = 1): Promise<void> {
    let day = this.shape.daily.get(date);
    if (!day) {
      day = emptyDailyMetric(date);
      this.shape.daily.set(date, day);
      this.shape.dailyIndex.add(date);
    }
    day[field] += by;
  }

  async getVisitor(vid: string): Promise<VisitorRecord | null> {
    return this.shape.visitors.get(vid) ?? null;
  }

  async getSession(sid: string): Promise<SessionRecord | null> {
    return this.shape.sessions.get(sid) ?? null;
  }

  async getDailyMetrics(keys: string[]): Promise<Array<DailyMetric | undefined>> {
    return keys.map((k) => this.shape.daily.get(k));
  }

  async getActiveMetricDates(fromKey: string, toKey: string): Promise<string[]> {
    const list: string[] = [];
    for (const k of this.shape.dailyIndex) {
      if (k >= fromKey && k <= toKey) list.push(k);
    }
    return list.sort();
  }

  async listSessions(from: number, to: number, limit: number): Promise<SessionRecord[]> {
    const all = [...this.shape.sessions.values()]
      .filter((s) => s.startedAt >= from && s.startedAt <= to)
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
      .slice(0, limit);
    return all;
  }

  async getLastEventAt(): Promise<number> {
    return this.shape.lastEventAt;
  }

  async getContact(id: string): Promise<ContactRequest | null> {
    return this.shape.contacts.get(id) ?? null;
  }

  async listContacts(opts: ListContactsOptions): Promise<Paginated<ContactRequest>> {
    let ids = [...this.shape.contacts.keys()];
    if (opts.status && opts.status !== 'ALL') {
      const st = this.shape.contactStatus.get(opts.status);
      if (!st) return { items: [], total: 0, page: opts.page, pageSize: opts.pageSize };
      ids = ids.filter((id) => st.has(id));
    }
    let rows = ids
      .map((id) => this.shape.contacts.get(id)!)
      .filter((c) => {
        if (opts.fromKey && c.createdAt < new Date(`${opts.fromKey}T00:00:00Z`).getTime()) return false;
        if (opts.toKey && c.createdAt > new Date(`${opts.toKey}T23:59:59Z`).getTime()) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    if (opts.q) {
      const q = opts.q.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q)
      );
    }
    const total = rows.length;
    const start = (opts.page - 1) * opts.pageSize;
    return { items: rows.slice(start, start + opts.pageSize), total, page: opts.page, pageSize: opts.pageSize };
  }

  async recentContacts(limit: number): Promise<ContactRequest[]> {
    return [...this.shape.contacts.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  async allContactIds(limit = 20000): Promise<string[]> {
    return [...this.shape.contacts.keys()].slice(0, limit);
  }

  async updateContact(id: string, fields: Partial<ContactRequest>): Promise<ContactRequest | null> {
    const c = this.shape.contacts.get(id);
    if (!c) return null;
    const next = { ...c, ...fields };
    this.shape.contacts.set(id, next);
    if (fields.status && fields.status !== c.status) {
      const old = this.shape.contactStatus.get(c.status);
      old?.delete(id);
      const st = this.shape.contactStatus.get(fields.status) ?? new Set<string>();
      st.add(id);
      this.shape.contactStatus.set(fields.status, st);
    }
    return next;
  }

  async listSecurityEvents(opts: SecurityListOptions): Promise<SecurityEvent[]> {
    let ids: string[] = [];
    const types = opts.types?.length ? opts.types : undefined;
    if (types) {
      for (const t of types) {
        const set = this.shape.securityByType.get(t);
        if (set) ids.push(...[...set]);
      }
    } else {
      ids = [...this.shape.security.keys()];
    }
    const items = ids
      .map((id) => this.shape.security.get(id))
      .filter((e): e is SecurityEvent => {
        if (!e) return false;
        if (opts.from && e.at < opts.from) return false;
        if (opts.to && e.at > opts.to) return false;
        return true;
      })
      .sort((a, b) => b.at - a.at)
      .slice(0, opts.limit ?? 50);
    return items;
  }

  async countSecurityByType(from: number, to: number): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const e of this.shape.security.values()) {
      if (e.at < from || e.at > to) continue;
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
    return counts;
  }
}

export const memoryStore = new MemoryStore();
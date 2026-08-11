/**
 * Redis storage backend (Upstash Redis REST). Used when env vars are present;
 * falls back to MemoryStore otherwise. Uses pipelines so a single event costs
 * ~2 round trips regardless of how many counters it touches.
 */

import { getRedis } from './redis';
import { K, TTL, VF } from './keys';
import type {
  DataStore,
  ListContactsOptions,
  Paginated,
  SecurityListOptions,
  TrackInput,
} from './store';
import type { DailyMetric, SessionRecord, VisitorRecord } from '@/types/analytics';
import type { ContactRequest, ContactStatus, ContactProcessing } from '@/types/contacts';
import type { SecurityEvent, SecurityEventType } from '@/types/security';
import { emptyDailyMetric } from './daily';
import { metricIncrementsForEvent } from './daily';
import { dateKey } from '@/lib/utils/date';
import {
  detectDevice,
  detectBrowser,
  detectOS,
  classifySource,
} from '@/lib/analytics/userAgent';
import { CONTACT_STATUSES } from '@/types/contacts';
import { SECURITY_EVENT } from '@/types/security';

const CONTACT_CAP = 5000;
const MGET_CHUNK = 50;

function num(v: string | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function asHash(v: unknown): Record<string, string> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, string>;
  }
  return null;
}

function asNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toNumMap(raw: Record<string, string> | null | undefined): Record<string, number> {
  if (!raw) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = num(v);
  return out;
}

export class RedisStore implements DataStore {
  private get r() {
    const r = getRedis();
    if (!r) throw new Error('RedisStore used without Redis configured');
    return r;
  }

  /* ── Writes ─────────────────────────────────────────────────────────── */

  async trackEvent(input: TrackInput): Promise<void> {
    const r = this.r;
    const { event } = input;
    const ua = input.userAgent ?? '';
    const ts = event.timestamp;
    const dayKey = dateKey(ts);

    const dedupKey = K.event(event.eventId);
    const claimed = await r.set(dedupKey, '1', { nx: true, ex: TTL.EVENT });
    if (claimed !== 'OK') return;

    const visKey = K.visitor(event.visitorId);
    const existing = asHash(await r.hgetall(visKey));
    const isNew = !existing || !existing[VF.firstSeen];

    // set raw event itself (TTL keeps it out of long-term aggregation)
    const pipe = r.pipeline();
    pipe.set(dedupKey, JSON.stringify(event), { ex: TTL.EVENT });

    // visitor
    if (isNew) {
      pipe.hset(visKey, {
        [VF.firstSeen]: String(ts),
        [VF.lastSeen]: String(ts),
        [VF.device]: detectDevice(ua),
        [VF.browser]: detectBrowser(ua),
        [VF.os]: detectOS(ua),
        [VF.language]: event.context.language ?? '',
        [VF.sessionCount]: '0',
      });
    } else {
      pipe.hset(visKey, { [VF.lastSeen]: String(ts) });
    }

    // session (read-modify-write)
    const sessionKey = K.session(event.sessionId);
    const prevRaw = await r.get<string>(sessionKey);
    const session: SessionRecord | null = prevRaw ? JSON.parse(prevRaw) : null;
    const next: SessionRecord = session ?? {
      id: event.sessionId,
      visitorId: event.visitorId,
      startedAt: ts,
      lastActivityAt: ts,
      landingPage: event.context.path || '/',
      pageViews: 0,
      durationMs: 0,
      referrer: event.context.referrer ?? undefined,
      source: classifySource(event.context),
      deviceType: detectDevice(ua),
      browser: detectBrowser(ua),
      os: detectOS(ua),
    };
    next.lastActivityAt = ts;
    next.exitPage = event.context.path || next.exitPage;
    next.durationMs = next.lastActivityAt - next.startedAt;
    if (event.eventName === 'PAGE_VIEW') next.pageViews += 1;
    pipe.set(sessionKey, JSON.stringify(next), { ex: TTL.SESSION });
    if (!session) {
      pipe.hincrby(visKey, VF.sessionCount, 1);
      pipe.sadd(K.dmSessions(dateKey(ts)), event.sessionId);
      pipe.zadd(K.sessionIndex(), { score: ts, member: event.sessionId });
    }

    // daily aggregation
    pipe.sadd(K.dmVisitors(dayKey), event.visitorId);
    pipe.sadd(isNew ? K.dmNew(dayKey) : K.dmRet(dayKey), event.visitorId);
    pipe.sadd(K.dmIndex(), dayKey);
    pipe.set(K.lastEvent(), String(ts));

    const increments = metricIncrementsForEvent(
      event.eventName,
      event.context,
      ua,
      event.eventName === 'PROJECT_VIEW' ? (event as { projectSlug: string }).projectSlug : undefined,
      event.eventName === 'CONTACT_FORM_ERROR' ? (event as { errorType: string }).errorType : undefined
    );
    for (const inc of increments) {
      switch (inc.hash) {
        case 'c':
          pipe.hincrby(K.dmCounters(dayKey), inc.field, 1);
          break;
        case 'p':
          pipe.hincrby(K.dmPages(dayKey), inc.field, 1);
          break;
        case 'pr':
          pipe.hincrby(K.dmProjects(dayKey), inc.field, 1);
          break;
        case 'src':
          pipe.hincrby(K.dmSources(dayKey), inc.field, 1);
          break;
        case 'dev':
          pipe.hincrby(K.dmDevices(dayKey), inc.field, 1);
          break;
        case 'br':
          pipe.hincrby(K.dmBrowsers(dayKey), inc.field, 1);
          break;
        case 'os':
          pipe.hincrby(K.dmOS(dayKey), inc.field, 1);
          break;
        case 'err':
          pipe.hincrby(K.dmErrors(dayKey), inc.field, 1);
          break;
      }
    }

    await pipe.exec();
  }

  async recordContact(contact: ContactRequest): Promise<void> {
    const r = this.r;
    const pipe = r.pipeline();
    pipe.set(K.contact(contact.id), JSON.stringify(contact));
    pipe.zadd(K.contactSorted(), { score: contact.createdAt, member: contact.id });
    pipe.zadd(K.contactStatus(contact.status), { score: contact.createdAt, member: contact.id });
    await pipe.exec();
  }

  async claimDuplicate(hash: string, contactId: string, ttlSec?: number): Promise<string | null> {
    const r = this.r;
    const res = await r.set(K.contactHash(hash), contactId, {
      nx: true,
      ex: ttlSec ?? TTL.DUPLICATE,
    });
    if (res === 'OK') return null;
    return (await r.get<string>(K.contactHash(hash))) ?? contactId;
  }

  async recordSecurityEvent(ev: SecurityEvent): Promise<void> {
    const r = this.r;
    const pipe = r.pipeline();
    pipe.set(K.security(ev.id), JSON.stringify(ev), { ex: TTL.SECURITY });
    pipe.zadd(K.securityAll(), { score: ev.at, member: ev.id });
    pipe.zadd(K.securityType(ev.type), { score: ev.at, member: ev.id });
    await pipe.exec();
  }

  async bumpDailyCounter(date: string, field: 'contacts' | 'spam', by = 1): Promise<void> {
    const pipe = this.r.pipeline();
    pipe.hincrby(K.dmCounters(date), field, by);
    pipe.sadd(K.dmIndex(), date);
    await pipe.exec();
  }

  /* ── Analytics reads ────────────────────────────────────────────────── */

  async getVisitor(vid: string): Promise<VisitorRecord | null> {
    const raw = await this.r.hgetall<Record<string, string>>(K.visitor(vid));
    if (!raw || !raw[VF.firstSeen]) return null;
    return {
      id: vid,
      firstSeenAt: num(raw[VF.firstSeen]),
      lastSeenAt: num(raw[VF.lastSeen]),
      deviceType: (raw[VF.device] as VisitorRecord['deviceType']) || 'desktop',
      browser: raw[VF.browser] || 'Other',
      os: raw[VF.os] || 'Other',
      language: raw[VF.language] || undefined,
      sessionCount: num(raw[VF.sessionCount]),
    };
  }

  async getSession(sid: string): Promise<SessionRecord | null> {
    const raw = await this.r.get<string>(K.session(sid));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionRecord;
    } catch {
      return null;
    }
  }

  async getDailyMetrics(keys: string[]): Promise<Array<DailyMetric | undefined>> {
    const r = this.r;
    const out: Array<DailyMetric | undefined> = new Array(keys.length).fill(undefined);
    const CHUNK = 25; // 25 days × 12 cmds = 300 per pipeline
    for (let start = 0; start < keys.length; start += CHUNK) {
      const chunk = keys.slice(start, start + CHUNK);
      const pipe = r.pipeline();
      chunk.forEach((day) => {
        pipe.hgetall(K.dmCounters(day));
        pipe.hgetall(K.dmPages(day));
        pipe.hgetall(K.dmProjects(day));
        pipe.hgetall(K.dmSources(day));
        pipe.hgetall(K.dmDevices(day));
        pipe.hgetall(K.dmBrowsers(day));
        pipe.hgetall(K.dmOS(day));
        pipe.hgetall(K.dmErrors(day));
        pipe.scard(K.dmVisitors(day));
        pipe.scard(K.dmNew(day));
        pipe.scard(K.dmRet(day));
        pipe.scard(K.dmSessions(day));
      });
      const results = await pipe.exec();
      chunk.forEach((day, idx) => {
        const base = idx * 12;
        const m = emptyDailyMetric(day);
        const c = asHash(results[base]);
        const p = asHash(results[base + 1]);
        const pr = asHash(results[base + 2]);
        const src = asHash(results[base + 3]);
        const dev = asHash(results[base + 4]);
        const br = asHash(results[base + 5]);
        const os = asHash(results[base + 6]);
        const err = asHash(results[base + 7]);
        const visitors = asNumber(results[base + 8]);
        const newV = asNumber(results[base + 9]);
        const retV = asNumber(results[base + 10]);
        const sessions = asNumber(results[base + 11]);

        m.pageViews = num(c?.['pageViews']);
        m.projectViews = num(c?.['projectViews']);
        m.outboundClicks = num(c?.['outboundClicks']);
        m.formViews = num(c?.['formViews']);
        m.formStarts = num(c?.['formStarts']);
        m.formSubmits = num(c?.['formSubmits']);
        m.formSuccess = num(c?.['formSuccess']);
        m.formErrors = num(c?.['formErrors']);
        m.contacts = num(c?.['contacts']);
        m.spam = num(c?.['spam']);
        m.visitors = visitors;
        m.newVisitors = newV;
        m.returningVisitors = retV;
        m.sessions = sessions;
        m.pages = toNumMap(p);
        m.projects = toNumMap(pr);
        m.sources = {
          direct: num(src?.['direct']),
          search: num(src?.['search']),
          social: num(src?.['social']),
          referral: num(src?.['referral']),
          campaign: num(src?.['campaign']),
          other: num(src?.['other']),
        };
        m.devices = {
          desktop: num(dev?.['desktop']),
          mobile: num(dev?.['mobile']),
          tablet: num(dev?.['tablet']),
        };
        m.browsers = toNumMap(br);
        m.os = toNumMap(os);
        m.errorTypes = toNumMap(err);
        out[start + idx] = m;
      });
    }
    return out;
  }

  async getActiveMetricDates(fromKey: string, toKey: string): Promise<string[]> {
    const members = await this.r.smembers(K.dmIndex());
    return members.filter((m) => m >= fromKey && m <= toKey).sort();
  }

  async listSessions(from: number, to: number, limit: number): Promise<SessionRecord[]> {
    const ids = await this.r.zrange<string[]>(K.sessionIndex(), from, to, {
      byScore: true,
      rev: true,
      offset: 0,
      count: limit,
    });
    return this.mgetJson<SessionRecord>(ids, K.session);
  }

  async getLastEventAt(): Promise<number> {
    const v = await this.r.get<string>(K.lastEvent());
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  /* ── Contacts ───────────────────────────────────────────────────────── */

  async getContact(id: string): Promise<ContactRequest | null> {
    const raw = await this.r.get<string>(K.contact(id));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ContactRequest;
    } catch {
      return null;
    }
  }

  async listContacts(opts: ListContactsOptions): Promise<Paginated<ContactRequest>> {
    const r = this.r;
    const status = opts.status && opts.status !== 'ALL' ? opts.status : undefined;
    const fromMs = opts.fromKey
      ? new Date(`${opts.fromKey}T00:00:00Z`).getTime()
      : Number.NEGATIVE_INFINITY;
    const toMs = opts.toKey
      ? new Date(`${opts.toKey}T23:59:59Z`).getTime() + 999
      : Number.POSITIVE_INFINITY;
    const min = Number.isFinite(fromMs) ? fromMs : '-inf';
    const max = Number.isFinite(toMs) ? toMs : '+inf';

    const master = status ? K.contactStatus(status) : K.contactSorted();

    if (opts.q) {
      const ids = await r.zrange<string[]>(master, min, max, {
        byScore: true,
        rev: true,
        offset: 0,
        count: CONTACT_CAP,
      });
      const q = opts.q.toLowerCase();
      const rows = (await this.mgetJson<ContactRequest>(ids, K.contact))
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.subject.toLowerCase().includes(q)
        )
        .sort((a, b) => b.createdAt - a.createdAt);
      const start = (opts.page - 1) * opts.pageSize;
      return {
        items: rows.slice(start, start + opts.pageSize),
        total: rows.length,
        page: opts.page,
        pageSize: opts.pageSize,
      };
    }

    const total = await r.zcount(master, min, max);
    // REV ZRANGEBYSCORE (newest-first) + page offset.
    const offset = (opts.page - 1) * opts.pageSize;
    const ids = await r.zrange<string[]>(master, min, max, {
      byScore: true,
      rev: true,
      offset,
      count: opts.pageSize,
    });
    return {
      items: await this.mgetJson<ContactRequest>(ids, K.contact),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  }

  async recentContacts(limit: number): Promise<ContactRequest[]> {
    const ids = await this.r.zrange<string[]>(K.contactSorted(), 0, limit - 1, {
      rev: true,
    });
    return this.mgetJson<ContactRequest>(ids, K.contact);
  }

  async allContactIds(limit = 20000): Promise<string[]> {
    return this.r.zrange<string[]>(K.contactSorted(), 0, limit - 1);
  }

  async updateContact(
    id: string,
    fields: Partial<ContactRequest>
  ): Promise<ContactRequest | null> {
    const r = this.r;
    const current = await this.getContact(id);
    if (!current) return null;
    const next: ContactRequest = { ...current, ...fields };
    const pipe = r.pipeline();
    pipe.set(K.contact(id), JSON.stringify(next));
    if (fields.status && fields.status !== current.status) {
      pipe.zadd(K.contactStatus(fields.status), { score: current.createdAt, member: id });
      pipe.zrem(K.contactStatus(current.status), id);
    }
    await pipe.exec();
    return next;
  }

  /* ── Security ───────────────────────────────────────────────────────── */

  async listSecurityEvents(opts: SecurityListOptions): Promise<SecurityEvent[]> {
    const r = this.r;
    const from = opts.from ?? 0;
    const to = opts.to ?? Date.now();
    const limit = opts.limit ?? 50;
    const types = opts.types?.length ? opts.types : undefined;
    let ids: string[] = [];
    if (types) {
      for (const t of types) {
        ids.push(
          ...(await r.zrange<string[]>(K.securityType(t), from, to, {
            byScore: true,
            rev: true,
            offset: 0,
            count: limit,
          }))
        );
      }
      ids = [...new Set(ids)];
    } else {
      ids = await r.zrange<string[]>(K.securityAll(), from, to, {
        byScore: true,
        rev: true,
        offset: 0,
        count: limit,
      });
    }
    const events = await this.mgetJson<SecurityEvent>(ids, K.security);
    return events
      .filter((e) => e.at >= from && e.at <= to)
      .sort((a, b) => b.at - a.at)
      .slice(0, limit);
  }

  async countSecurityByType(from: number, to: number): Promise<Record<string, number>> {
    const r = this.r;
    const types = Object.values(SECURITY_EVENT);
    const pipe = r.pipeline();
    types.forEach((t) => pipe.zcount(K.securityType(t), from, to));
    const results = await pipe.exec();
    const out: Record<string, number> = {};
    types.forEach((t, i) => {
      out[t] = Number(results[i] ?? 0);
    });
    return out;
  }

  /* ── helpers ────────────────────────────────────────────────────────── */

  private async mgetJson<T>(ids: string[], keyFn: (id: string) => string): Promise<T[]> {
    if (ids.length === 0) return [];
    const r = this.r;
    const out: T[] = [];
    for (let i = 0; i < ids.length; i += MGET_CHUNK) {
      const chunk = ids.slice(i, i + MGET_CHUNK);
      const raws = await r.mget<T[]>(...chunk.map((id) => keyFn(id)));
      chunk.forEach((_id, j) => {
        const raw = raws[j];
        if (typeof raw === 'string') {
          try {
            out.push(JSON.parse(raw) as T);
          } catch {
            // skip malformed
          }
        }
      });
    }
    return out;
  }
}

/** Contact statuses / processing types referenced for clarity when importing. */
export type { ContactStatus, ContactProcessing, SecurityEventType };
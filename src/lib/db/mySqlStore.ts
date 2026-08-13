/**
 * MySQL storage backend (mysql2/promise).
 *
 * Implements the same `DataStore` contract as the Redis and in-memory
 * backends. Design choices (mirroring the Database Architecture prompt):
 *
 * - Daily metrics are DERIVED on read from `analytics_event` / `session` /
 *   `visitor` / `contact` rows instead of being stored, so there is exactly one
 *   source of truth and no dual-write drift.
 * - Raw events are deduplicated atomically via the `event_id` primary key
 *   (idempotency, §30).
 * - `bumpDailyCounter` is intentionally a no-op here: contacts/spam per day are
 *   computed from the `contact` table, which is at least as accurate.
 * - All timestamps are stored as DATETIME(3) UTC and read back as epoch ms,
 *   matching `src/types/*.ts`.
 */

import mysql from 'mysql2/promise';
import { getMySqlPool } from './mysql';
import { emptyDailyMetric } from './daily';
import type {
  DataStore,
  ListContactsOptions,
  Paginated,
  SecurityListOptions,
  TrackInput,
} from './store';
import type { DailyMetric, SessionRecord, VisitorRecord } from '@/types/analytics';
import type { ContactRequest } from '@/types/contacts';
import type { SecurityEvent, SecurityEventType } from '@/types/security';
import { DEVICE, TRAFFIC_SOURCE } from '@/types/analytics';
import { CONTACT_STATUS } from '@/types/contacts';
import { SECURITY_EVENT } from '@/types/security';
import { DAY_MS } from '@/lib/utils/date';
import {
  detectDevice,
  detectBrowser,
  detectOS,
  classifySource,
} from '@/lib/analytics/userAgent';

type Row = mysql.RowDataPacket;
type ExecParams = (string | number | null | boolean | Date)[];

/* ── helpers ─────────────────────────────────────────────────────────── */

/** Epoch ms → 'YYYY-MM-DDTHH:mm:ss.sss' (UTC) for DATETIME(3) columns. */
function dt(ms: number): string {
  return new Date(ms).toISOString().slice(0, 23);
}

/** Inclusive day-key range → [fromMs, toMsExclusive). */
function dayBoundary(fromKey: string, toKey: string): [number, number] {
  const from = new Date(`${fromKey}T00:00:00.000Z`).getTime();
  const to = new Date(`${toKey}T00:00:00.000Z`).getTime() + DAY_MS;
  return [from, to];
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parseJson<T>(v: unknown, fallback: T): T {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== 'string') return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length ? v : undefined;
}

function like(s: string): string {
  return `%${s.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

/* ── row mappers ─────────────────────────────────────────────────────── */

function mapVisitor(r: Row): VisitorRecord {
  return {
    id: r.id as string,
    firstSeenAt: (r.first_seen_at as Date).getTime(),
    lastSeenAt: (r.last_seen_at as Date).getTime(),
    deviceType: (r.device_type as VisitorRecord['deviceType']) || 'desktop',
    browser: (r.browser as string) || 'Other',
    os: (r.os as string) || 'Other',
    language: str(r.language),
    sessionCount: num(r.session_count),
  };
}

function mapSession(r: Row): SessionRecord {
  return {
    id: r.id as string,
    visitorId: r.visitor_id as string,
    startedAt: (r.started_at as Date).getTime(),
    lastActivityAt: (r.last_activity_at as Date).getTime(),
    endedAt: r.ended_at ? (r.ended_at as Date).getTime() : undefined,
    landingPage: (r.landing_page as string) || '/',
    exitPage: str(r.exit_page),
    pageViews: num(r.page_views),
    durationMs: num(r.duration_ms),
    referrer: str(r.referrer),
    source: (r.source as SessionRecord['source']) || TRAFFIC_SOURCE.DIRECT,
    deviceType: (r.device_type as SessionRecord['deviceType']) || 'desktop',
    browser: (r.browser as string) || 'Other',
    os: (r.os as string) || 'Other',
  };
}

function mapContact(r: Row): ContactRequest {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    subject: r.subject as string,
    message: r.message as string,
    status: (r.status as ContactRequest['status']) || CONTACT_STATUS.NEW,
    processing: r.processing as ContactRequest['processing'],
    source: (r.source as ContactRequest['source']) || TRAFFIC_SOURCE.DIRECT,
    referrer: str(r.referrer),
    landingPage: str(r.landing_page),
    projectSlug: str(r.project_slug),
    campaign: str(r.campaign),
    deviceType: (r.device_type as ContactRequest['deviceType']) || undefined,
    browser: str(r.browser),
    os: str(r.os),
    language: str(r.language),
    spamScore: num(r.spam_score),
    spamFlags: parseJson<string[]>(r.spam_flags, []),
    duplicateOf: str(r.duplicate_of),
    createdAt: (r.created_at as Date).getTime(),
    timeline: parseJson<ContactRequest['timeline']>(r.timeline, []),
  };
}

function mapSecurity(r: Row): SecurityEvent {
  return {
    id: r.id as string,
    type: r.type as SecurityEventType,
    at: (r.occurred_at as Date).getTime(),
    ip: str(r.ip),
    path: str(r.path),
    reason: r.reason ? String(r.reason) : undefined,
    meta: parseJson<SecurityEvent['meta']>(r.meta, undefined),
  };
}

/* ── store ───────────────────────────────────────────────────────────── */

export class MySqlStore implements DataStore {
  /* ── writes ─────────────────────────────────────────────────────── */

  async trackEvent(input: TrackInput): Promise<void> {
    const { event } = input;
    const ua = input.userAgent ?? '';
    const pool = getMySqlPool();
    const device = detectDevice(ua);
    const browser = detectBrowser(ua);
    const os = detectOS(ua);
    const source = classifySource(event.context);
    const ts = dt(event.timestamp);
    const ctx = event.context;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [existsRows] = await conn.execute<Row[]>(
        'SELECT event_id FROM `analytics_event` WHERE event_id = ?',
        [event.eventId]
      );
      if (existsRows.length > 0) {
        await conn.commit();
        return; // duplicate event — idempotent
      }

      // visitor (new rows capture device/browser/os; existing only touch last_seen)
      await conn.execute(
        `INSERT INTO \`visitor\` (id, first_seen_at, last_seen_at, device_type, browser, os, language)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE last_seen_at = VALUES(last_seen_at), updated_at = CURRENT_TIMESTAMP(3)`,
        [event.visitorId, ts, ts, device, browser, os, ctx.language ?? null]
      );

      // session (read-modify-write)
      const [sessionRows] = await conn.execute<Row[]>(
        'SELECT * FROM `session` WHERE id = ?',
        [event.sessionId]
      );
      if (sessionRows.length === 0) {
        const pageViews = event.eventName === 'PAGE_VIEW' ? 1 : 0;
        await conn.execute(
          `INSERT INTO \`session\`
             (id, visitor_id, started_at, last_activity_at, landing_page, exit_page,
              page_views, duration_ms, referrer, source, device_type, browser, os)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            event.sessionId,
            event.visitorId,
            ts,
            ts,
            event.context.path || '/',
            event.context.path || null,
            pageViews,
            0,
            event.context.referrer ?? null,
            source,
            device,
            browser,
            os,
          ]
        );
        await conn.execute('UPDATE `visitor` SET session_count = session_count + 1 WHERE id = ?', [
          event.visitorId,
        ]);
      } else {
        const prev = sessionRows[0];
        const lastActivity = event.timestamp;
        const pageViews = num(prev.page_views) + (event.eventName === 'PAGE_VIEW' ? 1 : 0);
        const durationMs = Math.max(0, lastActivity - (prev.started_at as Date).getTime());
        await conn.execute(
          `UPDATE \`session\`
           SET last_activity_at = ?, exit_page = ?, page_views = ?, duration_ms = ?,
               updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ?`,
          [dt(lastActivity), event.context.path || null, pageViews, durationMs, event.sessionId]
        );
      }

      // raw event — the idempotency backstop
      const [eventRes] = await conn.execute<mysql.ResultSetHeader>(
        `INSERT IGNORE INTO \`analytics_event\`
           (event_id, event_name, occurred_at, session_id, visitor_id, path, project_slug,
            error_type, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            screen_width, language, timezone, form_time_ms, page_time_ms,
            source, device_type, browser, os)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.eventId,
          event.eventName,
          ts,
          event.sessionId,
          event.visitorId,
          event.context.path || '/',
          event.eventName === 'PROJECT_VIEW'
            ? (event as { projectSlug: string }).projectSlug
            : null,
          event.eventName === 'CONTACT_FORM_ERROR'
            ? (event as { errorType: string }).errorType
            : null,
          event.context.referrer ?? null,
          event.context.utmSource ?? null,
          event.context.utmMedium ?? null,
          event.context.utmCampaign ?? null,
          event.context.utmTerm ?? null,
          event.context.utmContent ?? null,
          event.context.screenWidth ?? null,
          event.context.language ?? null,
          event.context.timezone ?? null,
          event.context.formTimeMs ?? null,
          event.context.pageTimeMs ?? null,
          source,
          device,
          browser,
          os,
        ]
      );
      if (eventRes.affectedRows === 0) {
        // Race with a concurrent identical event — treat as seen.
        await conn.commit();
        return;
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback().catch(() => undefined);
      throw err;
    } finally {
      conn.release();
    }
  }

  async recordContact(contact: ContactRequest): Promise<void> {
    const pool = getMySqlPool();
    await pool.execute(
      `INSERT INTO \`contact\`
         (id, name, email, subject, message, status, processing, source, referrer,
          landing_page, project_slug, campaign, device_type, browser, os, language,
          spam_score, spam_flags, timeline, duplicate_of, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contact.id,
        contact.name,
        contact.email,
        contact.subject,
        contact.message,
        contact.status,
        contact.processing,
        contact.source,
        contact.referrer ?? null,
        contact.landingPage ?? null,
        contact.projectSlug ?? null,
        contact.campaign ?? null,
        contact.deviceType ?? null,
        contact.browser ?? null,
        contact.os ?? null,
        contact.language ?? null,
        contact.spamScore,
        contact.spamFlags.length ? JSON.stringify(contact.spamFlags) : null,
        JSON.stringify(contact.timeline),
        contact.duplicateOf ?? null,
        dt(contact.createdAt),
      ]
    );
    // NOTE: daily contacts/spam counters are derived from this table on read,
    // so `bumpDailyCounter` (called by persistContact) is a no-op here.
  }

  async claimDuplicate(hash: string, contactId: string, ttlSec?: number): Promise<string | null> {
    const pool = getMySqlPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Match Redis TTL semantics: claims older than the window no longer count.
      const windowStart = Date.now() - (ttlSec ?? 86_400) * 1000;
      await conn.execute('DELETE FROM `contact_duplicate` WHERE created_at < ?', [dt(windowStart)]);
      const [known] = await conn.execute<Row[]>(
        'SELECT contact_id FROM `contact_duplicate` WHERE hash = ? LIMIT 1',
        [hash]
      );
      if (known.length > 0) {
        await conn.commit();
        return known[0].contact_id as string;
      }
      // Atomic claim via the composite-identity-preserving PK; a concurrent
      // winner makes this update a no-op and the re-read returns their id.
      await conn.execute(
        'INSERT INTO `contact_duplicate` (hash, contact_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE contact_id = contact_id',
        [hash, contactId]
      );
      const [winner] = await conn.execute<Row[]>(
        'SELECT contact_id FROM `contact_duplicate` WHERE hash = ?',
        [hash]
      );
      await conn.commit();
      const winnerId = winner[0]?.contact_id;
      return typeof winnerId === 'string' && winnerId !== contactId ? winnerId : null;
    } catch (err) {
      await conn.rollback().catch(() => undefined);
      throw err;
    } finally {
      conn.release();
    }
  }

  async recordSecurityEvent(ev: SecurityEvent): Promise<void> {
    const pool = getMySqlPool();
    await pool.execute(
      `INSERT INTO \`security_event\` (id, type, occurred_at, ip, path, reason, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ev.id, ev.type, dt(ev.at), ev.ip ?? null, ev.path ?? null, ev.reason ?? null, ev.meta ?? null]
    );
  }

  /** Contacts/spam per day are derived from the `contact` table — no-op. */
  async bumpDailyCounter(): Promise<void> {
    // intentionally not implemented (see class docblock)
  }

  /* ── analytics reads ───────────────────────────────────────────── */

  async getVisitor(vid: string): Promise<VisitorRecord | null> {
    const pool = getMySqlPool();
    const [rows] = await pool.execute<Row[]>('SELECT * FROM `visitor` WHERE id = ?', [vid]);
    return rows.length ? mapVisitor(rows[0]) : null;
  }

  async getSession(sid: string): Promise<SessionRecord | null> {
    const pool = getMySqlPool();
    const [rows] = await pool.execute<Row[]>('SELECT * FROM `session` WHERE id = ?', [sid]);
    return rows.length ? mapSession(rows[0]) : null;
  }

  async getDailyMetrics(keys: string[]): Promise<Array<DailyMetric | undefined>> {
    if (keys.length === 0) return [];
    const pool = getMySqlPool();
    const [fromMs, toMs] = dayBoundary(keys[0], keys[keys.length - 1]);
    const from = dt(fromMs);
    const to = dt(toMs);
    const range = (sql: string) =>
      pool.execute<Row[]>(sql.replace('__RANGE__', 'occurred_at >= ? AND occurred_at < ?'), [from, to]);

    const [
      eventsRows,
      pageRows,
      projectRows,
      sourceRows,
      deviceRows,
      browserRows,
      osRows,
      errorRows,
      visitorRows,
      newVisitorRows,
      sessionRows,
      contactRows,
    ] = await Promise.all([
      range(
        `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, event_name, COUNT(*) c
         FROM \`analytics_event\` WHERE __RANGE__ GROUP BY d, event_name`
      ).then(([rows]) => rows),
      range(
        `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, path s, COUNT(*) c
         FROM \`analytics_event\` WHERE event_name = 'PAGE_VIEW' AND __RANGE__ GROUP BY d, s`
      ).then(([rows]) => rows),
      range(
        `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, project_slug s, COUNT(*) c
         FROM \`analytics_event\` WHERE event_name = 'PROJECT_VIEW' AND __RANGE__ GROUP BY d, s`
      ).then(([rows]) => rows),
      range(
        `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, source s, COUNT(*) c
         FROM \`analytics_event\` WHERE __RANGE__ GROUP BY d, s`
      ).then(([rows]) => rows),
      range(
        `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, device_type s, COUNT(*) c
         FROM \`analytics_event\` WHERE __RANGE__ GROUP BY d, s`
      ).then(([rows]) => rows),
      range(
        `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, browser s, COUNT(*) c
         FROM \`analytics_event\` WHERE __RANGE__ GROUP BY d, s`
      ).then(([rows]) => rows),
      range(
        `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, os s, COUNT(*) c
         FROM \`analytics_event\` WHERE __RANGE__ GROUP BY d, s`
      ).then(([rows]) => rows),
      range(
        `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, error_type s, COUNT(*) c
         FROM \`analytics_event\` WHERE event_name = 'CONTACT_FORM_ERROR' AND __RANGE__ GROUP BY d, s`
      ).then(([rows]) => rows),
      pool
        .execute<Row[]>(
          `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d, COUNT(DISTINCT visitor_id) c
           FROM \`analytics_event\`
           WHERE visitor_id IS NOT NULL AND occurred_at >= ? AND occurred_at < ? GROUP BY d`,
          [from, to]
        )
        .then(([rows]) => rows),
      pool
        .execute<Row[]>(
          `SELECT DATE_FORMAT(first_seen_at, '%Y-%m-%d') d, COUNT(*) c
           FROM \`visitor\` WHERE first_seen_at >= ? AND first_seen_at < ? GROUP BY d`,
          [from, to]
        )
        .then(([rows]) => rows),
      pool
        .execute<Row[]>(
          `SELECT DATE_FORMAT(started_at, '%Y-%m-%d') d, COUNT(*) c
           FROM \`session\` WHERE started_at >= ? AND started_at < ? GROUP BY d`,
          [from, to]
        )
        .then(([rows]) => rows),
      pool
        .execute<Row[]>(
          `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') d, COUNT(*) total,
                  COALESCE(SUM(CASE WHEN processing = 'SPAM' THEN 1 ELSE 0 END), 0) spam
           FROM \`contact\` WHERE created_at >= ? AND created_at < ? GROUP BY d`,
          [from, to]
        )
        .then(([rows]) => rows),
    ]);

    const eventCounts = new Map<string, Record<string, number>>();
    for (const r of eventsRows) {
      const d = r.d as string;
      const m = eventCounts.get(d) ?? {};
      m[r.event_name as string] = num(r.c);
      eventCounts.set(d, m);
    }
    const buckets = <T>() => new Map<string, Map<string, number>>();
    const pages = collect(buckets(), pageRows);
    const projects = collect(buckets(), projectRows);
    const sources = collect(buckets(), sourceRows);
    const devices = collect(buckets(), deviceRows);
    const browsers = collect(buckets(), browserRows);
    const os = collect(buckets(), osRows);
    const errors = collect(buckets(), errorRows);

    const visitors = new Map<string, number>(visitorRows.map((r) => [r.d as string, num(r.c)]));
    const newVisitors = new Map<string, number>(newVisitorRows.map((r) => [r.d as string, num(r.c)]));
    const sessions = new Map<string, number>(sessionRows.map((r) => [r.d as string, num(r.c)]));
    const contacts = new Map<string, { total: number; spam: number }>(
      contactRows.map((r) => [r.d as string, { total: num(r.total), spam: num(r.spam) }])
    );

    return keys.map((k) => {
      const m = emptyDailyMetric(k);
      const ev = eventCounts.get(k);
      if (ev) {
        m.pageViews = num(ev.PAGE_VIEW);
        m.projectViews = num(ev.PROJECT_VIEW);
        m.outboundClicks = num(ev.OUTBOUND_CLICK);
        m.formViews = num(ev.CONTACT_FORM_VIEW);
        m.formStarts = num(ev.CONTACT_FORM_START);
        m.formSubmits = num(ev.CONTACT_FORM_SUBMIT);
        m.formSuccess = num(ev.CONTACT_FORM_SUCCESS);
        m.formErrors = num(ev.CONTACT_FORM_ERROR);
      }
      mergeMap(m.pages, pages.get(k));
      mergeMap(m.projects, projects.get(k));
      mergeSourceMap(m.sources, sources.get(k));
      mergeDeviceMap(m.devices, devices.get(k));
      mergeMap(m.browsers, browsers.get(k));
      mergeMap(m.os, os.get(k));
      mergeMap(m.errorTypes, errors.get(k));

      m.visitors = visitors.get(k) ?? 0;
      m.newVisitors = Math.min(newVisitors.get(k) ?? 0, m.visitors);
      m.returningVisitors = Math.max(0, m.visitors - m.newVisitors);
      m.sessions = sessions.get(k) ?? 0;
      const cday = contacts.get(k);
      m.contacts = (cday?.total ?? 0) - (cday?.spam ?? 0);
      m.spam = cday?.spam ?? 0;
      return m;
    });
  }

  async getActiveMetricDates(fromKey: string, toKey: string): Promise<string[]> {
    const pool = getMySqlPool();
    const [from, to] = dayBoundary(fromKey, toKey);
    const [rows] = await pool.execute<Row[]>(
      `SELECT d FROM (
         SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') d FROM \`analytics_event\`
           WHERE occurred_at >= ? AND occurred_at < ?
         UNION
         SELECT DATE_FORMAT(created_at, '%Y-%m-%d') d FROM \`contact\`
           WHERE created_at >= ? AND created_at < ?
         UNION
         SELECT DATE_FORMAT(started_at, '%Y-%m-%d') d FROM \`session\`
           WHERE started_at >= ? AND started_at < ?
       ) t ORDER BY d`,
      [dt(from), dt(to), dt(from), dt(to), dt(from), dt(to)]
    );
    return rows.map((r) => r.d as string);
  }

  async listSessions(from: number, to: number, limit: number): Promise<SessionRecord[]> {
    const pool = getMySqlPool();
    // LIMIT is a validated internal integer — inlined (mysql2 prepared
    // statements reject bound LIMIT parameters).
    const [rows] = await pool.execute<Row[]>(
      `SELECT * FROM \`session\` WHERE started_at >= ? AND started_at <= ? ORDER BY last_activity_at DESC LIMIT ${limit}`,
      [dt(from), dt(to)]
    );
    return rows.map(mapSession);
  }

  async getLastEventAt(): Promise<number> {
    const pool = getMySqlPool();
    const [rows] = await pool.execute<Row[]>(
      'SELECT MAX(occurred_at) v FROM `analytics_event`'
    );
    const v = rows[0]?.v;
    return v instanceof Date ? v.getTime() : 0;
  }

  /* ── contacts ──────────────────────────────────────────────────── */

  async getContact(id: string): Promise<ContactRequest | null> {
    const pool = getMySqlPool();
    const [rows] = await pool.execute<Row[]>('SELECT * FROM `contact` WHERE id = ?', [id]);
    return rows.length ? mapContact(rows[0]) : null;
  }

  async listContacts(opts: ListContactsOptions): Promise<Paginated<ContactRequest>> {
    const pool = getMySqlPool();
    const where: string[] = [];
    const params: ExecParams = [];

    if (opts.status && opts.status !== 'ALL') {
      where.push('status = ?');
      params.push(String(opts.status));
    }
    if (opts.fromKey && opts.toKey) {
      const [from, to] = dayBoundary(opts.fromKey, opts.toKey);
      where.push('created_at >= ? AND created_at < ?');
      params.push(dt(from), dt(to));
    }
    if (opts.q) {
      const q = like(opts.q);
      where.push('(name LIKE ? ESCAPE "\\\\" OR email LIKE ? ESCAPE "\\\\" OR subject LIKE ? ESCAPE "\\\\")');
      params.push(q, q, q);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const from = `FROM \`contact\` ${whereSql}`;

    const [countRows] = await pool.execute<Row[]>(`SELECT COUNT(*) c ${from}`, params);
    const total = num(countRows[0]?.c);

    const offset = (opts.page - 1) * opts.pageSize;
    const [rows] = await pool.execute<Row[]>(
      `SELECT * ${from} ORDER BY created_at DESC LIMIT ${opts.pageSize} OFFSET ${offset}`,
      params
    );
    return { items: rows.map(mapContact), total, page: opts.page, pageSize: opts.pageSize };
  }

  async recentContacts(limit: number): Promise<ContactRequest[]> {
    const pool = getMySqlPool();
    const [rows] = await pool.execute<Row[]>(
      `SELECT * FROM \`contact\` ORDER BY created_at DESC LIMIT ${limit}`
    );
    return rows.map(mapContact);
  }

  async allContactIds(limit = 20000): Promise<string[]> {
    const pool = getMySqlPool();
    const [rows] = await pool.execute<Row[]>(
      `SELECT id FROM \`contact\` ORDER BY created_at DESC LIMIT ${limit}`
    );
    return rows.map((r) => r.id as string);
  }

  async updateContact(id: string, fields: Partial<ContactRequest>): Promise<ContactRequest | null> {
    const current = await this.getContact(id);
    if (!current) return null;
    const next: ContactRequest = { ...current, ...fields };
    const pool = getMySqlPool();
    await pool.execute(
      `UPDATE \`contact\` SET
         name = ?, email = ?, subject = ?, message = ?, status = ?, processing = ?,
         source = ?, referrer = ?, landing_page = ?, project_slug = ?, campaign = ?,
         device_type = ?, browser = ?, os = ?, language = ?, spam_score = ?,
         spam_flags = ?, timeline = ?, duplicate_of = ?
       WHERE id = ?`,
      [
        next.name,
        next.email,
        next.subject,
        next.message,
        next.status,
        next.processing,
        next.source,
        next.referrer ?? null,
        next.landingPage ?? null,
        next.projectSlug ?? null,
        next.campaign ?? null,
        next.deviceType ?? null,
        next.browser ?? null,
        next.os ?? null,
        next.language ?? null,
        next.spamScore,
        next.spamFlags.length ? JSON.stringify(next.spamFlags) : null,
        JSON.stringify(next.timeline),
        next.duplicateOf ?? null,
        id,
      ]
    );
    return next;
  }

  /* ── security ──────────────────────────────────────────────────── */

  async listSecurityEvents(opts: SecurityListOptions): Promise<SecurityEvent[]> {
    const pool = getMySqlPool();
    const where: string[] = [];
    const params: ExecParams = [];
    if (opts.types?.length) {
      where.push(`type IN (${opts.types.map(() => '?').join(', ')})`);
      params.push(...opts.types);
    }
    const from = dt(opts.from ?? 0);
    const to = dt(opts.to ?? Date.now());
    where.push('occurred_at >= ? AND occurred_at <= ?');
    params.push(from, to);
    const limit = opts.limit ?? 50;
    const [rows] = await pool.execute<Row[]>(
      `SELECT * FROM \`security_event\` WHERE ${where.join(' AND ')} ORDER BY occurred_at DESC LIMIT ${limit}`,
      params
    );
    return rows.map(mapSecurity);
  }

  async countSecurityByType(from: number, to: number): Promise<Record<string, number>> {
    const pool = getMySqlPool();
    const [rows] = await pool.execute<Row[]>(
      'SELECT type, COUNT(*) c FROM `security_event` WHERE occurred_at >= ? AND occurred_at <= ? GROUP BY type',
      [dt(from), dt(to)]
    );
    const out: Record<string, number> = {};
    for (const t of Object.values(SECURITY_EVENT)) out[t] = 0;
    for (const r of rows) out[r.type as string] = num(r.c);
    return out;
  }
}

/* ── small aggregation helpers ──────────────────────────────────────── */

function collect(
  map: Map<string, Map<string, number>>,
  rows: Row[]
): Map<string, Map<string, number>> {
  for (const r of rows) {
    const d = r.d as string;
    const inner = map.get(d) ?? new Map<string, number>();
    inner.set(r.s as string, num(r.c));
    map.set(d, inner);
  }
  return map;
}

function mergeMap(target: Record<string, number>, src: Map<string, number> | undefined): void {
  if (!src) return;
  for (const [k, v] of src) target[k] = (target[k] ?? 0) + v;
}

function mergeSourceMap(
  target: DailyMetric['sources'],
  src: Map<string, number> | undefined
): void {
  if (!src) return;
  const allowed = new Set<string>(Object.values(TRAFFIC_SOURCE));
  const map = target as Record<string, number>;
  for (const [k, v] of src) {
    if (allowed.has(k)) map[k] += v;
  }
}

function mergeDeviceMap(
  target: DailyMetric['devices'],
  src: Map<string, number> | undefined
): void {
  if (!src) return;
  const allowed = new Set<string>(Object.values(DEVICE));
  const map = target as Record<string, number>;
  for (const [k, v] of src) {
    if (allowed.has(k)) map[k] += v;
  }
}
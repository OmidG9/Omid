/**
 * Retention / data-pruning job for the MySQL backend.
 *
 * Deletes rows older than the configured retention window so the analytics,
 * security and session tables cannot grow without bound (mirrors the Redis
 * TTLs in src/lib/db/keys.ts). Contacts are business data and are never
 * pruned — admins archive them via status instead.
 *
 * Retention windows (days) come from the admin settings when they exist,
 * otherwise the defaults: events 90, sessions 90, security 90.
 *
 * Usage:
 *   DATABASE_URL=mysql://user:pass@host:3306/db npm run db:retention
 *   DRY_RUN=1 DATABASE_URL=... npm run db:retention   # report only, no deletes
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

for (const file of ['.env.local', '.env']) {
  try {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      process.loadEnvFile(path.join(process.cwd(), file));
    }
  } catch {
    // env file exists but could not be loaded — continue with process env
  }
}

const DEFAULT_DAYS = { events: 90, sessions: 90, security: 90 };

async function loadRetentionDays(conn) {
  try {
    const [rows] = await conn.query(
      "SELECT v FROM `admin_setting` WHERE k = 'settings' LIMIT 1"
    );
    if (rows.length) {
      const v = typeof rows[0].v === 'string' ? JSON.parse(rows[0].v) : rows[0].v;
      const r = v?.retentionDays ?? {};
      return {
        events: Number(r.events) || DEFAULT_DAYS.events,
        sessions: Number(r.sessions) || DEFAULT_DAYS.sessions,
        security: Number(r.security) || DEFAULT_DAYS.security,
      };
    }
  } catch {
    // table may not exist yet (migrations not applied) — fall back to defaults
  }
  return { ...DEFAULT_DAYS };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[db:retention] DATABASE_URL is not set.');
    process.exit(1);
  }

  const dryRun = process.env.DRY_RUN === '1';
  const conn = await mysql.createConnection({ uri: url, timezone: 'Z' });
  const days = await loadRetentionDays(conn);

  const cutoff = (d) => {
    const ms = Date.now() - d * 86_400_000;
    return new Date(ms).toISOString().slice(0, 23);
  };

  // table, delete-where clause, cutoff
  const tasks = [
    {
      table: 'security_event',
      where: 'occurred_at < ?',
      cutoff: cutoff(days.security),
      label: 'security_event',
    },
    {
      // deleting old sessions cascades to their analytics_event rows
      table: 'session',
      where: 'last_activity_at < ?',
      cutoff: cutoff(days.sessions),
      label: 'session (cascades analytics_event)',
    },
    {
      // deleting old visitors cascades remaining sessions/events
      table: 'visitor',
      where: 'last_seen_at < ?',
      cutoff: cutoff(days.events),
      label: 'visitor (cascades sessions/events)',
    },
  ];

  console.log(`[db:retention] ${dryRun ? 'DRY RUN' : 'RUN'} — windows:`, days);
  for (const t of tasks) {
    const sql = `DELETE FROM \`${t.table}\` WHERE ${t.where}`;
    if (dryRun) {
      const countSql = `SELECT COUNT(*) c FROM \`${t.table}\` WHERE ${t.where}`;
      const [rows] = await conn.query(countSql, [t.cutoff]);
      console.log(`[db:retention] would delete ~${rows[0]?.c ?? 0} rows from ${t.label}`);
    } else {
      const [res] = await conn.query(sql, [t.cutoff]);
      console.log(`[db:retention] deleted ${res.affectedRows} rows from ${t.label}`);
    }
  }

  // Duplicate-claim keys are transient; prune older than 48h regardless.
  const dupCutoff = cutoff(2);
  const dupCountSql =
    'SELECT COUNT(*) c FROM `contact_duplicate` WHERE created_at < ?';
  if (dryRun) {
    const [rows] = await conn.query(dupCountSql, [dupCutoff]);
    console.log(`[db:retention] would delete ~${rows[0]?.c ?? 0} rows from contact_duplicate`);
  } else {
    const [res] = await conn.query(
      'DELETE FROM `contact_duplicate` WHERE created_at < ?',
      [dupCutoff]
    );
    console.log(`[db:retention] deleted ${res.affectedRows} rows from contact_duplicate`);
  }

  await conn.end();
  console.log('[db:retention] done');
}

main().catch((err) => {
  console.error('[db:retention] failed:', err.message);
  process.exit(1);
});
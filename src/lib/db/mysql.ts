/**
 * MySQL connection layer (mysql2/promise, pooled).
 *
 * The pool is a lazy singleton keyed off DATABASE_URL (see MASTER PROMPT §86).
 * TODO(deploy): when DATABASE_URL is absent the store falls back to Redis /
 * in-memory, so the public site never breaks on a misconfigured database.
 *
 * Timezone handling: `timezone: 'Z'` makes mysql2 interpret DATETIME values
 * as UTC, matching the UTC day-key convention used across the analytics layer
 * (src/lib/utils/date.ts). We always write `YYYY-MM-DDTHH:mm:ss.SSS` UTC
 * strings so round-trips are independent of the server's local time.
 */

import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function isMySqlConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getMySqlPool(): mysql.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('MySqlStore used without DATABASE_URL configured');
    const u = new URL(url);
    const ssl =
      url.includes('ssl=true') ||
      url.includes('sslmode=require') ||
      url.includes('sslmode=required');
    pool = mysql.createPool({
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 3),
      charset: 'utf8mb4',
      timezone: 'Z',
      decimalNumbers: true,
      ...(ssl ? { ssl: {} } : {}),
    });
  }
  return pool;
}

/** Cheap reachability probe used by the admin health snapshot. */
export async function mySqlPing(): Promise<boolean> {
  if (!isMySqlConfigured()) return false;
  let conn: mysql.PoolConnection | null = null;
  try {
    conn = await getMySqlPool().getConnection();
    await conn.ping();
    return true;
  } catch {
    return false;
  } finally {
    conn?.release();
  }
}
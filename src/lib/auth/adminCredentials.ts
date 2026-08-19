/**
 * Database-backed admin credentials (Node.js runtime only).
 *
 * Credentials live in the `admin_user` table created by migration
 * 0004_admin_user.sql. Passwords are stored as salted scrypt KDF output
 * (`scrypt$N$r$p$keylen$salt$hash`) — never as plain text or a fast hash —
 * so a leaked database dump does not reveal the password.
 *
 * This module must NEVER be imported from Edge middleware: it pulls in
 * node:crypto and mysql2. The middleware only verifies HMAC session tokens
 * via `src/lib/auth/session.ts`.
 *
 * Bootstrap the first admin with: npm run admin:create
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import mysql from 'mysql2/promise';
import { getMySqlPool, isMySqlConfigured } from '@/lib/db/mysql';

type Row = mysql.RowDataPacket;

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 128 * 1024 * 1024;

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: number | null;
}

export type AdminLoginResult =
  | { ok: true; username: string; role: string }
  | { ok: false; code: 'NOT_CONFIGURED'; message: string }
  | { ok: false; code: 'BAD_CREDENTIALS' }
  | { ok: false; code: 'LOCKED'; retryAfterSec: number };

/** Hash a plaintext password into the portable scrypt string format. */
export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    SCRYPT_KEYLEN,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join('$');
}

/** Constant-time verification of a plaintext password against a stored hash. */
export async function verifyAdminPassword(input: string, encoded: string): Promise<boolean> {
  const parts = encoded.split('$');
  if (parts.length !== 7 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const keylen = Number(parts[4]);
  const salt = Buffer.from(parts[5], 'hex');
  const expected = Buffer.from(parts[6], 'hex');
  if (
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    !Number.isInteger(keylen) ||
    salt.length === 0 ||
    expected.length === 0
  ) {
    return false;
  }
  let actual: Buffer;
  try {
    actual = await scrypt(input, salt, keylen, { N, r, p, maxmem: SCRYPT_MAXMEM });
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function dt(ms: number): string {
  return new Date(ms).toISOString().slice(0, 23);
}

/** Look up an admin user by username (case-insensitive). */
export async function getAdminUser(username: string): Promise<AdminUser | null> {
  const pool = getMySqlPool();
  const [rows] = await pool.execute<Row[]>(
    `SELECT id, username, password_hash, role, is_active, failed_attempts, locked_until
     FROM \`admin_user\`
     WHERE username = ? LIMIT 1`,
    [username.trim().toLowerCase()]
  );
  const r = rows[0];
  if (!r) return null;
  const locked = r.locked_until ? (r.locked_until as Date).getTime() : null;
  return {
    id: r.id as string,
    username: r.username as string,
    passwordHash: r.password_hash as string,
    role: (r.role as string) || 'admin',
    isActive: Boolean(r.is_active),
    failedAttempts: num(r.failed_attempts),
    lockedUntil: locked && locked > 0 ? locked : null,
  };
}

/**
 * Verify username + password against the database with per-account lockout.
 * On success resets the failure counter; on failure increments it and locks
 * the account after LOCKOUT_THRESHOLD attempts.
 */
export async function authenticateAdmin(
  username: string,
  password: string
): Promise<AdminLoginResult> {
  if (!isMySqlConfigured()) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'پایگاه داده برای احراز هویت مدیر پیکربندی نشده است.' };
  }

  let user: AdminUser | null;
  try {
    user = await getAdminUser(username);
  } catch {
    return {
      ok: false,
      code: 'NOT_CONFIGURED',
      message: 'جدول admin_user در دسترس نیست. ابتدا `npm run db:migrate` و سپس `npm run admin:create` را اجرا کنید.',
    };
  }
  if (!user || !user.isActive) return { ok: false, code: 'BAD_CREDENTIALS' };

  const now = Date.now();
  if (user.lockedUntil && user.lockedUntil > now) {
    return { ok: false, code: 'LOCKED', retryAfterSec: Math.ceil((user.lockedUntil - now) / 1000) };
  }

  const match = await verifyAdminPassword(password, user.passwordHash);
  if (match) {
    await recordLoginSuccess(user.id);
    return { ok: true, username: user.username, role: user.role };
  }

  await recordLoginFailure(user.id, now);
  if (user.failedAttempts + 1 >= LOCKOUT_THRESHOLD) {
    return { ok: false, code: 'LOCKED', retryAfterSec: LOCKOUT_DURATION_MS / 1000 };
  }
  return { ok: false, code: 'BAD_CREDENTIALS' };
}

async function recordLoginSuccess(id: string): Promise<void> {
  const pool = getMySqlPool();
  await pool.execute(
    `UPDATE \`admin_user\`
     SET failed_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = CURRENT_TIMESTAMP(3)
     WHERE id = ?`,
    [dt(Date.now()), id]
  );
}

async function recordLoginFailure(id: string, now: number): Promise<void> {
  const pool = getMySqlPool();
  await pool.execute(
    `UPDATE \`admin_user\`
     SET failed_attempts = failed_attempts + 1,
         locked_until = IF(failed_attempts + 1 >= ?, ?, locked_until),
         updated_at = CURRENT_TIMESTAMP(3)
     WHERE id = ?`,
    [LOCKOUT_THRESHOLD, dt(now + LOCKOUT_DURATION_MS), id]
  );
}
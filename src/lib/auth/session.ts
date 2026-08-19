/**
 * Lightweight admin session auth.
 *
 * Uses Web Crypto (crypto.subtle) so the same module works on the Edge
 * runtime (middleware) and Node.js (API routes). The session is an
 * HMAC-SHA256 signed token: base64url(payload).base64url(sig).
 *
 * Secret/password policy (hardened):
 * - Production (`NODE_ENV=production`) requires real `ADMIN_SECRET` and
 *   `ADMIN_PASSWORD`; the well-known dev defaults are rejected there, and a
 *   missing secret disables auth (the login route then returns 500 with a
 *   clear message) instead of silently falling back to a guessable value.
 * - Development uses the dev fallbacks ONLY when explicitly opted in via
 *   `ALLOW_DEV_AUTH=1`. Without it, an unconfigured secret means auth is
 *   disabled locally too — no silent `admin`/`admin` login.
 */

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

// Dev-only fallbacks — never used in production and never used in
// development unless ALLOW_DEV_AUTH=1 is set.
const DEV_SIGNING_SECRET = 'ghanbariomid-dev-only-admin-secret-8f2a';
const DEV_PASSWORD = 'admin';

/** Dev fallbacks require an explicit opt-in flag outside production. */
function devAuthAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_AUTH === '1';
}

const encoder = new TextEncoder();

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function getSigningSecret(): string | null {
  const fromEnv = process.env.ADMIN_SECRET;
  if (fromEnv && fromEnv.trim()) {
    const secret = fromEnv.trim();
    // The dev secret is public knowledge — never accept it outside an
    // explicit dev opt-in (protects against copying dev env into prod).
    if (secret === DEV_SIGNING_SECRET && !devAuthAllowed()) {
      console.warn('[auth] ADMIN_SECRET equals the known dev secret and was ignored; set a real secret.');
      return null;
    }
    return secret;
  }
  if (devAuthAllowed()) return DEV_SIGNING_SECRET;
  return null;
}

export function isAuthConfigured(): boolean {
  return getSigningSecret() !== null;
}

/** Expected password for login. Dev fallback only with ALLOW_DEV_AUTH=1. */
export function getAdminPassword(): string | null {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv && fromEnv.trim()) {
    const password = fromEnv.trim();
    if (password === DEV_PASSWORD && !devAuthAllowed()) {
      console.warn('[auth] ADMIN_PASSWORD equals the well-known dev password and was ignored; set a real password.');
      return null;
    }
    return password;
  }
  if (devAuthAllowed()) return DEV_PASSWORD;
  return null;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

async function hmacVerify(data: string, sigB64: string, secret: string): Promise<boolean> {
  const key = await importKey(secret);
  try {
    return await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sigB64),
      encoder.encode(data)
    );
  } catch {
    return false;
  }
}

interface SessionPayload {
  sub: 'admin';
  iat: number;
  exp: number;
}

export async function createSessionToken(): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) throw new Error('ADMIN_SECRET is not configured');
  const now = Date.now();
  const payload: SessionPayload = {
    sub: 'admin',
    iat: now,
    exp: now + SESSION_MAX_AGE_SEC * 1000,
  };
  const payloadB64 = b64urlEncode(encoder.encode(JSON.stringify(payload)));
  const sig = await hmacSign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const secret = getSigningSecret();
  if (!secret) return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const ok = await hmacVerify(payloadB64, sig, secret);
  if (!ok) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as SessionPayload;
    if (payload.sub !== 'admin') return false;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

/** Constant-time-ish compare for the login password (digest-based). */
export async function verifyAdminPassword(input: string): Promise<boolean> {
  const expected = getAdminPassword();
  if (!expected) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(input)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  if (av.length !== bv.length) return false;
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}
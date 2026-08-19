/**
 * Create (or reset) the admin user in the `admin_user` table.
 *
 * Generates a random, hard-to-guess username and a strong password when none
 * are provided, hashes the password with salted scrypt (same format as
 * src/lib/auth/adminCredentials.ts) and upserts the row. Prints the
 * credentials exactly once — store them somewhere safe afterwards.
 *
 * Usage:
 *   npm run admin:create
 *   ADMIN_USERNAME=my-name ADMIN_PASSWORD='my-strong-password' npm run admin:create
 *
 * Username rules: 3-64 chars, lowercase [a-z0-9_]. Password must be >= 12 chars
 * (a strong value is generated for you when not supplied).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const mysql = require('mysql2/promise');

// Load .env.local so `npm run admin:create` works like the app.
for (const file of ['.env.local', '.env']) {
  try {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      process.loadEnvFile(path.join(process.cwd(), file));
    }
  } catch {
    // env file exists but could not be loaded — continue with process env
  }
}

const scrypt = promisify(crypto.scrypt);

const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 128 * 1024 * 1024;

const USERNAME_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';

function randomUsername() {
  let out = '';
  for (let i = 0; i < 12; i++) out += USERNAME_CHARS[crypto.randomInt(USERNAME_CHARS.length)];
  return out;
}

function randomPassword() {
  return crypto.randomBytes(18).toString('base64url'); // 24 chars
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, SCRYPT_KEYLEN, salt.toString('hex'), derived.toString('hex')].join('$');
}

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`admin_user\` (
  \`id\` CHAR(36) NOT NULL,
  \`username\` VARCHAR(64) NOT NULL,
  \`password_hash\` VARCHAR(512) NOT NULL,
  \`role\` VARCHAR(32) NOT NULL DEFAULT 'admin',
  \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`failed_attempts\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`locked_until\` DATETIME(3) NULL,
  \`last_login_at\` DATETIME(3) NULL,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_admin_user_username\` (\`username\`),
  CONSTRAINT \`chk_admin_username_len\` CHECK (CHAR_LENGTH(\`username\`) BETWEEN 3 AND 64),
  CONSTRAINT \`chk_admin_role\` CHECK (\`role\` IN ('admin', 'owner'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[admin:create] DATABASE_URL is not set.');
    console.error('[admin:create] Example: DATABASE_URL=mysql://user:pass@host:3306/db npm run admin:create');
    process.exit(1);
  }

  const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (username && !/^[a-z0-9_]{3,64}$/.test(username)) {
    console.error('[admin:create] ADMIN_USERNAME must be 3-64 chars: lowercase letters, digits or underscore.');
    process.exit(1);
  }
  if (password && password.length < 12) {
    console.error('[admin:create] ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  const finalUsername = username || randomUsername();
  const finalPassword = password || randomPassword();

  const conn = await mysql.createConnection({ uri: url, multipleStatements: true, timezone: 'Z' });
  try {
    await conn.query(CREATE_TABLE_SQL);
    const hash = await hashPassword(finalPassword);
    await conn.query(
      `INSERT INTO \`admin_user\` (id, username, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         is_active = TRUE,
         failed_attempts = 0,
         locked_until = NULL,
         updated_at = CURRENT_TIMESTAMP(3)`,
      [crypto.randomUUID(), finalUsername, hash]
    );
  } finally {
    await conn.end();
  }

  console.log('');
  console.log('[admin:create] Admin user is ready.');
  console.log('──────────────────────────────────────────────');
  console.log(`  Username : ${finalUsername}`);
  console.log(`  Password : ${finalPassword}`);
  console.log('──────────────────────────────────────────────');
  console.log('Store these somewhere safe. They will NOT be shown again.');
}

main().catch((err) => {
  console.error('[admin:create] failed:', err.message);
  process.exit(1);
});
/**
 * Minimal MySQL migrations runner (plain Node CJS — no build step).
 *
 * Applies `db/migrations/*.sql` files in filename order, recording applied
 * files in the `schema_migrations` table. Re-runnable: applied files are kept
 * track of and never re-executed, matching the project's "safe, additive
 * migrations" rule (§31).
 *
 * Usage:
 *   DATABASE_URL=mysql://user:pass@host:3306/db npm run db:migrate
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

// Load .env.local so `npm run db:migrate` works like the app.
for (const file of ['.env.local', '.env']) {
  try {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      process.loadEnvFile(path.join(process.cwd(), file));
    }
  } catch {
    // env file exists but could not be loaded — continue with process env
  }
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');
const TABLE = 'schema_migrations';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[db:migrate] DATABASE_URL is not set.');
    console.error('[db:migrate] Example: DATABASE_URL=mysql://user:pass@host:3306/db npm run db:migrate');
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.error(`[db:migrate] No .sql files found in ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const conn = await mysql.createConnection({ uri: url, multipleStatements: true, timezone: 'Z' });
  console.log('[db:migrate] connected');

  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [rows] = await conn.query(`SELECT name FROM ${TABLE}`);
    const applied = new Set(rows.map((r) => r.name));

    let ran = 0;
    let skipped = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[db:migrate] skip   ${file} (already applied)`);
        skipped += 1;
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await conn.query(sql);
      await conn.query(`INSERT INTO ${TABLE} (name) VALUES (?)`, [file]);
      console.log(`[db:migrate] apply  ${file}`);
      ran += 1;
    }

    console.log(`[db:migrate] done — applied=${ran}, skipped=${skipped}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('[db:migrate] failed:', err.message);
  process.exit(1);
});
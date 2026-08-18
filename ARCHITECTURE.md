# ARCHITECTURE — GhanbariOmid.ir Personal Intelligence Dashboard

Status: MVP implementation baseline, updated after the hardening pass (2026-08).

## 1. Existing Architecture (audit result)

- Framework: Next.js 14 (App Router), TypeScript (strict), React 18.
- Styling: TailwindCSS v4 (CSS-first `@theme` tokens), Framer Motion, GSAP.
- Fonts: Vazirmatn (fa), `dir="rtl"` root layout.
- Contact: `react-hook-form` + `react-hot-toast` → `POST /api/contact`.
- Validation: Zod (`src/lib/contactSchema.ts`) incl. honeypot `company` field.
- Email: Nodemailer dark HTML template, header-injection + HTML escaping (`src/lib/email.ts`).
- Rate limiting: `src/lib/rateLimiter.ts` — Upstash Redis sliding-window, in-memory Map fallback (with periodic sweep).
- Storage: **MySQL (primary)** with Redis and in-memory backends behind one `DataStore` interface (`src/lib/db/`).
- Auth: HMAC-signed session cookie, rate-limited login (`src/lib/auth/session.ts`).
- Deploy: Vercel (Next.js auto-detect), Node.js runtime for API routes.

## 2. Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Persistence | MySQL primary (`DATABASE_URL`); Redis legacy fallback; memory for dev/tests | Full SQL: queryable analytics, integrity (FKs/checks), survives restarts; Redis kept working for existing setups. |
| Settings | Stored in primary backend: MySQL `admin_setting` table → Redis → memory | Thresholds (rate limit, spam, retention) persist across restarts and instances. |
| Auth | Lightweight HMAC session cookie (`ADMIN_SECRET`), rate-limited login | Zero new dependencies; server-side verified in `middleware.ts`; no silent dev fallback — `ALLOW_DEV_AUTH=1` required in dev, well-known dev values rejected in production. |
| Retention | `scripts/retention.js` prunes `analytics_event`/`session`/`visitor`/`security_event`/`contact_duplicate` by configured days | Mirrors Redis TTLs (`src/lib/db/keys.ts`); contacts are never auto-pruned. |
| Charts | Hand-rolled inline SVG components | Avoids recharts dependency; bundle stays small. |
| Aggregation | Daily metrics derived on read from relational tables | Single source of truth, no dual-write drift; indexed on `occurred_at`/`started_at`. |
| IP trust | `x-forwarded-for` trusted only on Vercel or with `TRUST_PROXY=1` | Raw header is spoofable; rate limits and spam scoring need a trustworthy IP (`src/lib/utils/ip.ts`). |
| Security headers | CSP + HSTS + frame/referrer/permissions policy in `next.config.js` | Defense-in-depth on top of the pipeline. |

No other new third-party dependency is introduced.

## 3. Data Model (MySQL primary)

Tables (see `db/migrations/`): `visitor`, `session`, `analytics_event`,
`contact`, `contact_duplicate`, `security_event`, `admin_setting`, plus
`schema_migrations` (runner bookkeeping).

- `analytics_event.event_id` is the idempotency key (dedupe).
- FKs: `session → visitor`, `analytics_event → session/visitor` (CASCADE);
  `contact.duplicate_of → contact` (SET NULL).
- All timestamps DATETIME(3) UTC, read back as epoch ms.
- Contacts are business data and are never pruned; admins archive via status.

Legacy Redis layout (kept for compatibility): `ano:` analytics, `ct:` contacts,
`sec:` security, `rl:` rate limit — see `src/lib/db/keys.ts` and
`src/lib/db/redisStore.ts`.

## 4. Tracking Pipeline

```
Public site (client SDK, fire-and-forget, beacon)
  → POST /api/analytics/track   (validate, normalize, rate-limit)
  → store event + update visitor/session records
  → Dashboard reads via admin-only services (filtered by date range)
```

- Analytics failures never break the public site: the client sends via
  `sendBeacon` in a `try/catch`; the API route isolates errors per event.
- Anonymous `visitorId` (UUID) + `sessionId` (UUID) are created client-side and
  persisted in cookies (no fingerprinting).

## 5. Metric Definitions

- **Visitor**: anonymous identifier (`visitorId`) seen at least once in the period.
- **New visitor**: first-ever event in the store during the period.
- **Returning visitor**: visitor with events before the period start.
- **Session**: interaction period with a 30-min timeout (configurable).
- **Page view**: `PAGE_VIEW` event for a route.
- **Project view**: `PROJECT_VIEW` event (slug).
- **Conversion rate**: successful submissions stored as contacts / contact-form
  exposure (form views), same window. Denominator = `CONTACT_FORM_VIEW`.
- **Project conversion**: contacts attributed to a project / project views, same window.
- **Bounce rate** (informational): sessions with exactly 1 page view.
- **Form funnel**: CONTACT_FORM_VIEW → CONTACT_FORM_START → CONTACT_FORM_SUCCESS.
- **Growth**: current vs previous equivalent-length period;
  `calculatePercentageChange` handles 0→n, n→0, missing data.

## 6. Security Model

- All `/admin/*` routes protected by `middleware.ts` (HMAC-signed session cookie);
  all `/api/admin/*` also protected server-side (defense in depth).
- Auth hardening: no silent dev fallback; `ALLOW_DEV_AUTH=1` opt-in in dev;
  well-known dev secret/password rejected in production; fail-closed login.
- Contact pipeline: server Zod validation → rate limit → honeypot → timing →
  risk score → duplicates → persist → notify → analytics.
- Contact persistence outlives email failure; analytics failure never
  invalidates contacts.
- Untrusted values sanitized/escaped at render, in email HTML, and for SMTP
  headers (already in `email.ts`).
- Security events (SPAM_DETECTED, RATE_LIMIT_TRIGGERED, INVALID_PAYLOAD,
  BLOCKED_REQUEST, …) stored without private content.
- Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy,
  Permissions-Policy, COOP) applied globally in `next.config.js`.
- Client IP: `x-forwarded-for` trusted only on Vercel or behind an explicit
  `TRUST_PROXY=1` reverse proxy (`src/lib/utils/ip.ts`).

## 7. Admin Navigation (MVP)

```
/admin               Dashboard
/admin/analytics     Overview + Visitors / Pages / Traffic / Devices / Projects / Performance
/admin/contacts      Requests
/admin/security      Security
/admin/settings      Settings (thresholds, retention)
```

## 8. Admin API Surface

- `/api/admin/analytics/*` — overview, visitors, pages, traffic, devices, projects, performance
- `/api/admin/contacts` + `/api/admin/contacts/[id]` + `/export`
- `/api/admin/security/overview`
- `/api/admin/settings` (read/write thresholds; persisted to MySQL/Redis)
- `/api/admin/login`, `/api/admin/logout`

## 9. Environment Variables

See `.env.local.example` for the full annotated list. Key ones:

```text
ADMIN_SECRET                  # required for /admin auth (HMAC session key)
ADMIN_PASSWORD                # required for /admin auth
SITE_URL                      # canonical domain (default https://ghanbariomid.ir)
DATABASE_URL                  # MySQL (primary storage)
SMTP_*                        # contact email delivery
UPSTASH_REDIS_REST_URL/TOKEN  # optional legacy backend / rate limiting
ALLOW_DEV_AUTH=1              # dev-only opt-in for local fallback creds
TRUST_PROXY=1                 # trust x-forwarded-for behind your own proxy
CONTACT_TO                    # optional email override (falls back to SMTP_USER)
```

## 10. Operations

- Migrations: `npm run db:migrate` (idempotent, recorded in `schema_migrations`).
- Retention: `npm run db:retention` (or `DRY_RUN=1` to preview) — prune old
  analytics/sessions/security rows per the configured windows; schedule nightly.
- Quality gate: `npm run check` (lint + typecheck + test). CI runs the same.
- MySQL integration tests: `TEST_MYSQL_URL=... npm test`.

## 11. Phases

0. Audit + this document ✅
1. Foundation: store, types, auth, admin shell, UI kit, date ranges, services ✅
2. Tracking: event system, client SDK, track API, wiring ✅
3. Dashboard: overview + analytics pages + charts + insights/alerts ✅
4. Contacts: persistence, contact admin, attribution, timeline, CSV ✅
5. Security: anti-spam scoring, security events, `/admin/security` ✅
6. Form intelligence: funnel, health, conversion ✅
7. Polish: states, responsiveness, a11y, motion ✅
8. Quality gate + hardening (auth, headers, retention, IP trust) ✅

## 12. Explicitly Out of Scope (MVP)

Microservices, Kafka/Elasticsearch/warehouse, WebSockets, CRM, marketing
automation, ML/AI, session replay, heatmaps, fingerprinting, multi-tenant,
enterprise RBAC, SOC dashboards.
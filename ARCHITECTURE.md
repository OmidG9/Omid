# ARCHITECTURE — GhanbariOmid.ir Personal Intelligence Dashboard

Status: MVP implementation baseline. Written after a full repository audit (Phase 0).

## 1. Existing Architecture (audit result)

- Framework: Next.js 14 (App Router), TypeScript (strict), React 18.
- Styling: TailwindCSS v4 (CSS-first `@theme` tokens), Framer Motion, GSAP.
- Fonts: Vazirmatn (fa), `dir="rtl"` root layout.
- Contact: `react-hook-form` + `react-hot-toast` → `POST /api/contact`.
- Validation: Zod (`src/lib/contactSchema.ts`) incl. honeypot `company` field.
- Email: Nodemailer dark HTML template, header-injection + HTML escaping (`src/lib/email.ts`).
- Rate limiting: `src/lib/rateLimiter.ts` — Upstash Redis sliding-window, in-memory Map fallback.
- Storage: **none** (no database, no auth, no chart lib, no tests).
- Deploy: Vercel (Next.js auto-detect), Node.js runtime for API routes.

## 2. Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Persistence | Upstash Redis + in-memory fallback | `@upstash/redis` already a dependency (rate limiter); serverless-native; TTL retention built-in; no new vendor. |
| Auth | DB-backed credentials (`admin_user` table) + HMAC session cookie (`ADMIN_SECRET`), rate-limited + lockout login | Passwords stored as salted scrypt hashes, never in env vars; server-side verified in `middleware.ts`; single ADMIN role, role-aware structures. |
| Charts | Hand-rolled inline SVG components | Avoids recharts dependency; bundle stays small; charts are simple (line/bar/donut). |
| Aggregation | Daily metrics (`DailyMetric`) updated per event + raw events with TTL | Keeps dashboard queries bounded; re-runnable; retention per master prompt. |

No other new third-party dependency is introduced.

## 3. Data Model (Redis key design)

Prefixes: `ano:` (analytics), all values stored as JSON strings unless noted.

| Key | Type | Purpose | TTL |
|---|---|---|---|
| `ano:event:<id>` | string | Raw event JSON | 90 d |
| `ano:visitor:<vid>` | hash | Visitor profile (first/last seen, device/browser/os, country, returning) | 1 y |
| `ano:visitor:<vid>:ids` | set | session ids for a visitor | 90 d |
| `ano:session:<sid>` | string | Session JSON (landing/exit, pageViews, duration, referrer, source) | 90 d |
| `ano:dm:YYYY-MM-DD` | string | DailyMetric JSON (visitors, new, returning, sessions, views, contacts, spam, form funnel, errors) | long-term |
| `ano:dm:idx` | set | all daily metric dates | long-term |
| `ano:sec:<id>` | string | Security event JSON | 90 d |
| `ano:sec:<id>/...` idx | lists | recent security events by type | 90 d |
| `ct:contact:<id>` | string | Contact JSON | until archived/deleted |
| `ct:idx` | set | contact ids | until archived/deleted |
| `ct:hash:<sha>` | string | duplicate-detection hash → contact id | 24 h |
| `rl:contact:<ip>` | zset | existing rate limiter | existing |

Sessions are split: `ano:session:<sid>` for detail; visitor/session relationships via sets.

## 4. Tracking Pipeline

```
Public site (client SDK, fire-and-forget, beacon)
  → POST /api/analytics/track   (validate, normalize, rate-limit)
  → store event + update DailyMetric + visitor/session records
  → Dashboard reads via admin-only services (filtered by date range)
```

- Analytics failures never break the public site: the client sends via `sendBeacon` in a `try/catch`; the API route isolates errors per event.
- Anonymous `visitorId` (UUID) + `sessionId` (UUID) are created client-side and persisted in cookies (no fingerprinting). Returning-visitor determined by existing visitor cookie within attribution window.

## 5. Metric Definitions

- **Visitor**: anonymous identifier (`visitorId`) seen at least once in the period.
- **New visitor**: first-ever event in the store during the period.
- **Returning visitor**: visitor with events before the period start.
- **Session**: interaction period with a 30-min timeout (configurable). Starts on `PAGE_VIEW`/`SESSION_START`, ended by timeout/period boundary.
- **Page view**: `PAGE_VIEW` event for a route.
- **Project view**: `PROJECT_VIEW` event (slug).
- **Conversion rate**: successful submissions stored as contacts / contact-form exposure (form views), same window. Documented denominator = `CONTACT_FORM_VIEW`.
- **Project conversion**: contacts attributed to a project / project views, same window & attribution rule.
- **Bounce rate** (informational): sessions with exactly 1 page view.
- **Form funnel**: CONTACT_FORM_VIEW → CONTACT_FORM_START → CONTACT_FORM_SUCCESS. Start rate, submission rate, abandonment = (starts − success)/starts.
- **Growth**: current vs previous equivalent-length period; `calculatePercentageChange` handles 0→n, n→0, and missing data without misleading percentages.

## 6. Security Model

- All `/admin/*` routes protected by `middleware.ts` (HMAC-signed session cookie).
- All `/api/admin/*` also protected server-side (defense in depth).
- Contact pipeline: server Zod validation → rate limit → honeypot → timing → risk score → duplicates → persist → notify → analytics.
- Contact persistence outlives email failure; analytics failure never invalidates contacts.
- Untrusted values sanitized/escaped at render, in email HTML, and for SMTP headers (already in `email.ts`).
- Security events (SPAM_DETECTED, RATE_LIMIT_TRIGGERED, INVALID_PAYLOAD, BLOCKED_REQUEST, …) stored without private content.

## 7. Admin Navigation (MVP)

```
/admin               Dashboard
/admin/analytics     Overview (redirect to /admin) + Visitors / Pages / Traffic / Devices / Projects / Performance
/admin/contacts      Requests
/admin/security      Security
/admin/settings      Settings (thresholds, retention)
```

## 8. Admin API Surface

- `/api/admin/analytics/overview` (metrics, traffic series, top pages/projects/sources/devices, daily summary, form health, insights, alerts)
- `/api/admin/analytics/visitors`, `/pages`, `/traffic`, `/devices`, `/projects`, `/performance`
- `/api/admin/contacts` + `/api/admin/contacts/[id]` (detail, status, update)
- `/api/admin/contacts/export` (CSV)
- `/api/admin/security/overview`
- `/api/admin/settings` (read/write thresholds with validation)

## 9. Environment Variables

```text
ADMIN_SECRET                  # required for /admin auth (HMAC session key)
DATABASE_URL                  # required for admin login (admin_user table)
```

Admin credentials live in the `admin_user` table (migration `0004_admin_user.sql`)
with salted scrypt password hashes. Bootstrap the first admin with
`npm run admin:create`; the script generates a random username and strong
password so the login id is not guessable.

## 10. Phases

0. Audit + this document ✅
1. Foundation: store, types, auth, admin shell, UI kit, date ranges, services
2. Tracking: event system, client SDK, track API, wiring
3. Dashboard: overview + analytics pages + charts + insights/alerts
4. Contacts: persistence, contact admin, attribution, timeline, CSV
5. Security: anti-spam scoring, security events, `/admin/security`
6. Form intelligence: funnel, health, conversion
7. Polish: states, responsiveness, a11y, motion
8. Quality gate: lint, typecheck, build, regression + security verification

## 11. Explicitly Out of Scope (MVP)

Microservices, Kafka/Elasticsearch/warehouse, WebSockets, CRM, marketing automation, ML/AI, session replay, heatmaps, fingerprinting, multi-tenant, enterprise RBAC, SOC dashboards.
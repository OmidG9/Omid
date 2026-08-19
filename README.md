# Portfolio + Personal Intelligence Dashboard — Omid Ghanbari

Portfolio site + private admin dashboard for **ghanbariomid.ir**, built with
**Next.js 14 (App Router)**, TypeScript (strict), TailwindCSS v4, Framer Motion,
GSAP, MySQL (primary storage), Upstash Redis (optional legacy/rate-limiting).

---

## Getting Started

**Requirements:** Node.js 22+, npm 10+

```bash
npm install
cp .env.local.example .env.local   # then fill in real values
npm run dev                        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

---

## Environment Variables

All variables are documented in `.env.local.example`. The important ones:

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_SECRET` | yes (prod) | HMAC key that signs admin session cookies |
| `ADMIN_PASSWORD` | yes (prod) | Admin dashboard password |
| `SITE_URL` | no | Canonical domain for SEO metadata/sitemap (default `https://ghanbariomid.ir`) |
| `DATABASE_URL` | no* | MySQL connection (primary storage when set) |
| `SMTP_HOST/PORT/USER/PASS` | for email | Contact-form email delivery |
| `UPSTASH_REDIS_REST_URL/TOKEN` | no | Legacy Redis backend / rate limiting |
| `ALLOW_DEV_AUTH=1` | dev only | Explicit opt-in for the local dev admin credentials |
| `TRUST_PROXY=1` | behind nginx | Trust `x-forwarded-for` for client IPs |

\* Without `DATABASE_URL` the app falls back to Redis, then in-memory — the
public site never breaks on a misconfigured database.

> **Security:** there is no silent `admin/admin` fallback. In production,
> `ADMIN_SECRET`/`ADMIN_PASSWORD` must be real values; the well-known dev
> secret is rejected. In development, auth is disabled unless you explicitly
> set `ALLOW_DEV_AUTH=1`.

---

## Admin Dashboard

The `/admin` area (login at `/admin/login`) gives you:

- **Overview** — visitors, sessions, page/project views, form funnel, alerts
- **Analytics** — visitors / pages / traffic sources / devices / projects / performance
- **Contacts** — leads, status workflow (NEW → READ → REPLIED / ARCHIVED / SPAM), CSV export
- **Security** — spam, rate-limit, invalid-payload and auth-failure events
- **Settings** — rate limits, spam threshold, duplicate window, retention days

All `/admin/*` pages and `/api/admin/*` routes are protected by an HMAC-signed
session cookie verified in `middleware.ts` (defense in depth).

---

## Storage

MySQL is the primary backend (`DATABASE_URL`). Apply migrations with:

```bash
npm run db:migrate
```

Prune old analytics/session/security rows according to the retention settings:

```bash
npm run db:retention          # actually deletes
DRY_RUN=1 npm run db:retention  # preview only
```

Contacts are business data and are never pruned automatically.

---

## Editing Content

All text, projects, skills, experience, and social links live in
**`src/data/portfolio.ts`** — no other files need to change to update the site.

### Adding a Project

1. Add an entry to the `projects` array in `portfolio.ts`:

```typescript
{
  slug: 'my-project',
  title: '...',
  subtitle: '...',
  description: '...',
  longDescription: '...',
  stack: ['Next.js', 'MongoDB'],
  category: ['Full-Stack'],          // Full-Stack | Frontend | UI/UX | WordPress
  coverImage: '/projects/my-project/cover.jpg',
  images: [{ src: '/projects/my-project/cover.jpg', alt: '...' }],
  liveUrl: 'https://...',            // optional
  githubUrl: 'https://github.com/...', // optional
  demoUrl: 'https://...',            // optional — enables demo button
  demoType: 'link',                  // 'link' | 'embed' (sandboxed iframe)
  features: ['...'],
}
```

2. Place images in `public/projects/my-project/` (recommended cover: 1200×630 px).

---

## Quality Gates

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # vitest (unit + route + integration-skip)
npm run check       # all three
```

The MySQL integration tests (`src/lib/db/mySqlStore.integration.test.ts`) run
only when `TEST_MYSQL_URL` is set:

```bash
TEST_MYSQL_URL="mysql://root@127.0.0.1:3306/omid_portfolio" npm test
```

---

## Deploy

1. Push to GitHub (CI runs lint + typecheck + tests automatically).
2. Import at [vercel.com](https://vercel.com) — Next.js is auto-detected.
3. Set the environment variables from `.env.local.example` in Vercel project
   settings (especially `ADMIN_SECRET`, `ADMIN_PASSWORD`, `DATABASE_URL`,
   `SITE_URL`, `SMTP_*`).
4. Apply migrations once: `npm run db:migrate`, then schedule
   `npm run db:retention` (e.g. a nightly cron).

---

## Color Palette

| Token      | Value             | Usage               |
| ---------- | ----------------- | ------------------- |
| Background | #020617 slate-950 | Page background     |
| Surface    | #0f172a slate-900 | Cards               |
| Accent     | #3b82f6 blue-500  | Buttons, highlights |
| Text       | #f1f5f9 slate-100 | Headings            |
| Muted      | #94a3b8 slate-400 | Body text           |
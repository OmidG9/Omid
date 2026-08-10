# MASTER PROMPT — Omid Ghanbari Portfolio Analytics & Intelligence Dashboard

## 0. Mission

You are building a professional analytics and intelligence dashboard for my personal portfolio site: **ghanbariomid.ir**.

The goal is a modern, secure, scalable, and extensible admin dashboard for tracking visitor behavior, contact leads, performance, and security.

This should be a complete system, not just a page with a few charts.

> Web Analytics + Visitor Intelligence + Contact Lead Management + Performance Analytics + Security Monitoring

---

## 1. Project Rules

Before changing any code:
- Audit the repository.
- Review the existing architecture.
- Identify current technologies.
- Inspect existing APIs.
- Check the current contact form.
- Review rate limiting.
- Validate metadata and routing.
- Examine dependencies.
- Avoid unnecessary abstractions.
- Keep new architecture aligned with the current project.

Use the README as the source of truth.
The project currently uses:
- Next.js 14 App Router
- TypeScript
- TailwindCSS v4
- Framer Motion
- GSAP

The project already includes:
- `/api/contact`
- Contact form UI
- `contactSchema`
- email service
- rate limiter
- portfolio data
- dynamic project pages

Do not change this structure without a clear architectural reason.

---

## 2. Dashboard Goals

The dashboard must answer real product questions across these domains:

### Visitors
- Total visitors
- Page views
- Unique visitors
- Sessions
- Countries
- Devices
- Desktop / Mobile / Tablet share
- Browsers
- Operating systems
- Landing pages and exit pages
- Top pages
- Average session duration
- Bounce rate
- New vs returning visitors

### Traffic Sources
- Google
- Direct
- Instagram
- LinkedIn
- GitHub
- Telegram
- Referral
- Other sites
- UTM campaigns

### Pages
- Highest viewed pages
- Highest viewed projects
- Common user paths
- Exit pages

### Contact / Leads
- Contact form views
- Form starts
- Form submissions
- Conversion rate
- New leads
- Lead status
- Latest leads
- Lead source
- Landing page and referrer before submission

### Growth
- Change vs yesterday
- Change vs last week
- Change vs last month
- Visitor growth
- Contact submission growth
- Conversion trend

### Technical
- Browser distribution
- OS distribution
- Device distribution
- Screen size distribution
- Page load performance
- Core Web Vitals when available
- Error rate
- API errors
- 404s
- Slow pages

### Security
- Suspicious requests
- Rate limit events
- Abnormal traffic patterns
- Repeated IPs when useful
- Unusual user agents
- Bot/crawler signals
- Failed contact submissions
- Spam risk

---

## 3. Privacy Principles

This is a personal portfolio, so privacy is critical.
- Do not store sensitive user data unless technically required.
- Avoid passwords, detailed personal identifiers, permanent fingerprints, or unnecessary private data.
- Use anonymous identifiers like `anonymousVisitorId` for visitor tracking.
- Store IP addresses only when necessary, using hashing, truncation, or strict retention.
- Design for data retention, deletion, and anonymous analytics.

---

## 4. Architecture

Split the system into two main areas:
- Public application: `ghanbariomid.ir`
- Private admin application: `/admin` or `/dashboard`

Admin routes must be fully protected.
No analytics data should be visible to public visitors.

---

## 5. Recommended Structure

Design for Next.js App Router, but do not rebuild without inspection.
Suggested directory layout:

```text
src/
├── app/
│   ├── page.tsx
│   ├── projects/
│   ├── api/
│   │   ├── contact/
│   │   ├── analytics/
│   │   │   ├── track/
│   │   │   ├── session/
│   │   │   └── events/
│   │   └── admin/
│   │       ├── analytics/
│   │       ├── contacts/
│   │       └── security/
│   └── admin/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── analytics/
│       ├── visitors/
│       ├── pages/
│       ├── traffic/
│       ├── contacts/
│       ├── devices/
│       ├── performance/
│       ├── security/
│       └── settings/
├── components/
│   ├── admin/
│   └── analytics/
├── lib/
│   ├── analytics/
│   ├── auth/
│   ├── security/
│   ├── database/
│   └── utils/
├── data/
└── types/
```

---

## 6. Analytics Pipeline

Design the flow as:

```text
Visitor → Client SDK → Tracking Endpoint → Validation → Rate Limiting → Event Processing → Database → Aggregation → Admin Dashboard
```

Tracking must be lightweight and non-blocking.

---

## 7. Event Tracking

Implement a generic event system with discriminated unions.
Base event types should include:
- `PAGE_VIEW`
- `SESSION_START`
- `SESSION_END`
- `CONTACT_FORM_VIEW`
- `CONTACT_FORM_START`
- `CONTACT_FORM_SUBMIT`
- `CONTACT_FORM_SUCCESS`
- `CONTACT_FORM_ERROR`
- `PROJECT_VIEW`
- `OUTBOUND_CLICK`
- `SOCIAL_CLICK`
- `DOWNLOAD`
- `SCROLL_DEPTH`
- `ERROR`

Keep it extensible for future event types.

---

## 8. Page View Data

Capture page view properties when available:
- eventId
- visitorId
- sessionId
- path
- referrer
- timestamp
- userAgent
- deviceType
- browser
- browserVersion
- os
- osVersion
- screenWidth
- screenHeight
- language
- timezone
- country
- region
- city (only when appropriate)
- utmSource
- utmMedium
- utmCampaign
- utmTerm
- utmContent

Do not invent unverifiable data.

---

## 9. Visitor and Session Models

Keep visitor and session separate.
A visitor is an anonymous identity across multiple sessions.
A session is a page interaction period.

Session data should include:
- sessionId
- visitorId
- startedAt
- lastActivityAt
- endedAt
- landingPage
- exitPage
- pageViews
- duration
- referrer
- device
- browser
- country

Make session timeout configurable, not hard-coded.

---

## 10. Contact Analytics

Integrate analytics with the existing `POST /api/contact` endpoint without breaking current behavior.
Track contact form events for view, start, submit, success, and error.

---

## 11. Lead Management

Build a contact lead section with:
- id
- name
- email
- message
- createdAt
- status
- source
- landingPage
- referrer
- sessionId
- visitorId

Lead statuses should include:
- NEW
- READ
- REPLIED
- ARCHIVED
- SPAM

Support search, filtering, sorting, pagination, detail view, and status updates.

---

## 12. Admin Dashboard UX

The admin UI should feel premium, minimal, modern, dark, and professional.
Use the site palette unless there is a strong UX reason to adjust it.

Palette:
- Background: `#020617`
- Surface: `#0f172a`
- Accent: `#3b82f6`
- Text: `#f1f5f9`
- Muted: `#94a3b8`

---

## 13. API and Services

Use domain-based APIs:
- `/api/analytics/track`
- `/api/admin/analytics/overview`
- `/api/admin/analytics/visitors`
- `/api/admin/analytics/pages`
- `/api/admin/analytics/traffic`
- `/api/admin/analytics/devices`
- `/api/admin/analytics/realtime`
- `/api/admin/contacts`
- `/api/admin/security`

No client component should query the database directly.
Use service layers such as:
- `analyticsService`
- `visitorService`
- `contactService`
- `performanceService`
- `securityService`

---

## 14. Authentication and Security

Admin authentication must be real and server-side verified.
Do not use client-only auth.
Protect admin routes before rendering.
Separate authentication from authorization.
Design for future roles such as `ADMIN` and `VIEWER`.

All APIs must include:
- input validation
- rate limiting
- authorization
- error handling
- logging

Use Zod for validation if appropriate.
Do not expose secrets in the client bundle.
Validate environment variables.

---

## 15. Dashboard Experience

Provide:
- loading states
- empty states
- error states
- skeletons
- responsive layouts

Prevent layout shift.
Ensure charts are responsive.
Make tables usable on mobile with scroll or responsive cards.

---

## 16. Filters and Date Ranges

Build a shared date-range system with:
- Today
- Yesterday
- Last 7 Days
- Last 30 Days
- Last 90 Days
- This Month
- Last Month
- Custom Range

Include shared filters for date, country, device, browser, OS, page, source, and campaign.
Encode filters in the URL for sharing.

---

## 17. Exports and Search

Support server-side CSV export for visitors, pages, contacts, traffic, and events.
Provide search with pagination and query limits for contacts, pages, projects, visitors, and events.

---

## 18. Insights and Alerts

Design a rule-based intelligence layer for analytics insights.
Example insights:
- Traffic increased 28% compared to the previous period.
- Most visitors came from mobile.
- Project X received 42% more views this week.
- Contact conversion dropped by 8%.

Build this with future AI integration in mind, but do not lock to any provider.
Add alert capabilities for:
- traffic spikes
- unusual traffic
- contact submission growth
- rising 5xx errors
- rate limit spikes

---

## 19. Metrics and Definitions

Support metrics such as:
- Total Visitors
- Unique Visitors
- Sessions
- Page Views
- Pages / Session
- New Visitors
- Returning Visitors
- Bounce Rate
- Average Session Duration
- Engagement Rate
- Contact Views
- Contact Starts
- Contact Submissions
- Successful Contacts
- Conversion Rate
- Project Views
- Outbound Clicks
- Top Pages
- Top Projects
- Top Countries
- Top Browsers
- Top Devices
- Top OS

Create a shared utility like `calculatePercentageChange(current, previous)` and avoid duplicate calculations.
Document metric definitions in analytics documentation.

---

## 20. Data Practices

Avoid unlimited raw event storage.
Adopt raw events → aggregation → daily/hourly metrics → dashboard.
Keep aggregation re-runnable.
Use short-lived cache for dashboard queries.
Do not cache real-time analytics for long.
Keep production dashboards grounded in real data; isolate mock data for development.

---

## 21. Development Phases

Use phased work:

### Phase 0 — Audit
- Review repository, architecture, dependencies, contact API, rate limiter, styles, deployment.
- Create `ARCHITECTURE.md` and the implementation plan.

### Phase 1 — Foundation
- Database
- Analytics models
- Admin authentication
- Admin layout
- Sidebar
- Shared UI
- Date range system
- API conventions

### Phase 2 — Tracking
- Visitor tracking
- Session tracking
- Page view tracking
- Referrer capture
- Device/browser/OS capture
- UTM tracking
- Event system

### Phase 3 — Dashboard
- Overview
- KPI cards
- Charts
- Visitors
- Pages
- Traffic
- Devices

### Phase 4 — Contact Intelligence
- Contact events
- Lead management
- Contact dashboard
- Funnel tracking
- Conversion analytics

### Phase 5 — Advanced Analytics
- User journey
- Project analytics
- Geography
- Engagement
- Growth
- Real-time analytics

### Phase 6 — Performance & Security
- Performance metrics
- Errors
- Rate limit analytics
- Bot detection
- Security events

### Phase 7 — Intelligence
- Rule-based insights
- Alerts
- Anomaly detection foundation
- AI-ready architecture

---

## 22. Final Quality Gate

Before completion, run:

```bash
npm run lint
npm run build
```

If available, run:

```bash
npm test
```

No TypeScript errors should remain.
No unnecessary console errors should remain.

---

## 23. Final Principle

The dashboard should answer more than "how many visitors".
It should answer:

> Who visited anonymously, where they came from, what devices they used, which pages they viewed, which projects they engaged with, how long they stayed, whether they reached contact, whether they started or submitted the form, whether a lead was created, and how behavior changed over time.

Privacy, security, performance, and maintainability must be core architecture principles from day one.

Begin with a repository audit and create `ARCHITECTURE.md`.

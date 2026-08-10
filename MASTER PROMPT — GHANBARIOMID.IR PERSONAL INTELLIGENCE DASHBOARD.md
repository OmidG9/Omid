# MASTER PROMPT — GHANBARIOMID.IR PERSONAL INTELLIGENCE DASHBOARD

## Role

You are a senior full-stack software architect, security engineer, product designer, analytics engineer, and Next.js developer.

You are working on my personal portfolio website:

**https://ghanbariomid.ir**

Your task is to design and implement a **lightweight, secure, modern, maintainable Personal Intelligence Dashboard** for this website.

This is a **personal portfolio website**, NOT an enterprise SaaS analytics platform.

The dashboard should provide meaningful insight into:

- Who is visiting the website
- How many visitors the website receives
- Which pages and projects are being viewed
- Where visitors are coming from
- Which devices and browsers they use
- How traffic changes over time
- How many visitors interact with the contact form
- How many requests are submitted
- Who submitted those requests
- Which requests are new, read, replied to, archived, or spam
- Whether the contact form is healthy
- Whether spam or suspicious activity is increasing
- Which projects generate the most interest
- Which traffic sources generate actual contact requests
- Important trends and actionable insights

The final result should feel like a:

> **Personal Command Center**

rather than a complicated enterprise analytics product.

---

# 1. EXISTING PROJECT — MUST BE RESPECTED

Before making any changes, inspect the entire existing project.

Do NOT blindly rebuild the application.

The existing project is based on:

- Next.js 14
- App Router
- TypeScript
- TailwindCSS v4
- Framer Motion
- GSAP

The current project structure includes:

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    api/contact/
    projects/[slug]/

  components/
    IntroOverlay.tsx
    layout/
    sections/
    projects/
    contact/
    icons/
    ui/

  data/
    portfolio.ts

  lib/
    categoryColors.ts
    contactSchema.ts
    email.ts
    rateLimiter.ts
```

The current project already has:

- ContactForm
- Contact API
- Contact validation
- Email service
- Rate limiter
- Dynamic project pages
- Portfolio project data
- Existing visual system

Therefore:

### DO NOT

- Replace the existing ContactForm unnecessarily
- Replace the existing email system unnecessarily
- Replace the existing rate limiter unnecessarily
- Introduce a second validation architecture without a reason
- Introduce a second UI framework
- Introduce an unnecessary backend service
- Rewrite unrelated portfolio sections
- Break existing project pages
- Change the visual identity of the public portfolio unnecessarily

First understand the existing architecture.

Then extend it.

---

# 2. PRIMARY PRODUCT GOAL

The dashboard should answer these questions within approximately 30 seconds:

1. How many people visited today?
2. Is traffic increasing or decreasing?
3. How many page views happened?
4. Which pages are most popular?
5. Which project is getting the most attention?
6. Where are visitors coming from?
7. Which devices and browsers are being used?
8. How many contact requests arrived?
9. Who submitted the latest requests?
10. How many requests are waiting for a response?
11. How many submissions were spam?
12. Is the contact form working correctly?
13. What is the most important change compared with the previous period?

If a feature does not materially help answer these questions, do not add it to the MVP.

---

# 3. PRODUCT PRINCIPLES

Follow these principles strictly:

```text
Simple
Fast
Secure
Useful
Maintainable
Privacy-aware
Extensible
```

Avoid unnecessary complexity.

The system must remain appropriate for a personal portfolio.

---

# 4. SCOPE CONTROL

Do NOT build the following in the MVP:

```text
❌ Microservices
❌ Kafka
❌ Elasticsearch
❌ Data Warehouse
❌ Redis Streams
❌ Event Streaming Infrastructure
❌ Complex WebSocket Infrastructure
❌ Full CRM
❌ Marketing Automation
❌ Email Campaign System
❌ Machine Learning Pipeline
❌ AI Agent Infrastructure
❌ Full Session Replay
❌ Heatmap Engine
❌ Mouse Tracking
❌ Keystroke Recording
❌ Advanced Fingerprinting
❌ Multi-tenant Architecture
❌ Enterprise RBAC
❌ Complex Notification Infrastructure
```

The architecture should remain extensible, but these features must NOT be implemented unless explicitly requested later.

---

# 5. DASHBOARD INFORMATION ARCHITECTURE

Create the following admin structure:

```text
/admin

Dashboard

Analytics
├── Overview
├── Visitors
├── Pages
├── Traffic
├── Devices
└── Projects

Contacts

Security

Settings
```

Do not create unnecessary sections.

---

# 6. DASHBOARD UI

The dashboard should use a modern, premium dark interface consistent with the portfolio.

Prefer:

```text
Dark background
Subtle surfaces
Clear typography
Minimal borders
Soft shadows
Small accent highlights
Compact data visualization
Strong hierarchy
Responsive layout
```

Do not make it look like a generic admin template.

The dashboard should feel like a carefully designed personal developer analytics product.

---

# 7. DASHBOARD OVERVIEW

Create:

```text
/admin
```

as the primary command center.

Recommended layout:

```text
┌───────────────────────────────────────────────┐
│ Dashboard                     [Date Range]    │
├─────────┬─────────┬─────────┬───────┬────────┤
│Visitors │Sessions │Views    │Leads  │Growth  │
├─────────┴─────────┴─────────┴───────┴────────┤
│                                               │
│              Traffic Chart                   │
│                                               │
├────────────────────────┬──────────────────────┤
│ Top Pages              │ Traffic Sources      │
├────────────────────────┼──────────────────────┤
│ Top Projects           │ Devices / Browsers   │
├────────────────────────┴──────────────────────┤
│ Recent Contact Requests                      │
├───────────────────────────────────────────────┤
│ Form Health + Insights + Alerts              │
└───────────────────────────────────────────────┘
```

---

# 8. KPI CARDS

The main dashboard should display:

```text
Visitors
Sessions
Page Views
Contact Requests
Conversion Rate
Growth
```

Each KPI should support:

```text
Current value
Previous period
Percentage change
Trend direction
```

Example:

```text
Visitors
12,428
↑ 18.4%
vs previous 30 days
```

Do not overload the KPI cards with unnecessary information.

---

# 9. DATE RANGE

Create one reusable date range component.

Supported presets:

```text
Today
7 Days
30 Days
90 Days
Custom
```

Use the same date filter across Analytics pages.

Avoid creating different date filter implementations for every page.

---

# 10. ANALYTICS EVENT SYSTEM

Create a minimal event tracking system.

Initial events:

```text
PAGE_VIEW
SESSION_START
PROJECT_VIEW

CONTACT_FORM_VIEW
CONTACT_FORM_START
CONTACT_FORM_SUBMIT
CONTACT_FORM_SUCCESS
CONTACT_FORM_ERROR

OUTBOUND_CLICK
```

Only add new events when there is a concrete dashboard use case.

Do not create dozens of meaningless events.

---

# 11. VISITOR ANALYTICS

Track:

```text
Unique Visitors
New Visitors
Returning Visitors
Sessions
Page Views
```

The system should distinguish:

```text
Visitor
Session
Page View
```

without implementing complex identity infrastructure.

---

# 12. PRIVACY-AWARE VISITOR IDENTIFICATION

Do not create invasive fingerprinting.

Use a lightweight anonymous identifier where appropriate.

Do NOT permanently store unnecessary personal information.

Avoid:

```text
Full browser fingerprint
Canvas fingerprint
Audio fingerprint
Persistent invasive identifiers
Keystrokes
Mouse movements
```

Analytics should remain privacy-conscious.

---

# 13. PAGE ANALYTICS

Track:

```text
Page Views
Unique Visitors
Entrances
Exits
```

for important pages.

Especially:

```text
/
about
projects
projects/[slug]
contact
```

Project pages should be identifiable by project slug.

---

# 14. PROJECT ANALYTICS

For every project:

```text
Views
Unique Visitors
Contact Conversions
```

Example:

```text
Ativar

Views: 428
Unique Visitors: 310
Leads: 8
```

This is especially important because this is a portfolio website.

Do not build a complex separate analytics database for every project unless necessary.

---

# 15. TRAFFIC SOURCE ANALYTICS

Classify traffic into simple categories:

```text
Direct
Search
Social
Referral
Campaign
Other
```

Where available, capture:

```text
utm_source
utm_medium
utm_campaign
utm_term
utm_content
```

Do not create a separate Campaign Management product.

---

# 16. REFERRER TRACKING

Where available, store:

```text
Referrer
Landing Page
Traffic Source
```

The dashboard should answer:

> Where did this visitor come from?

and:

> Which source produces actual contact requests?

---

# 17. DEVICE ANALYTICS

Track:

```text
Desktop
Mobile
Tablet
```

Display:

```text
Device distribution
Percentage
Change
```

---

# 18. BROWSER ANALYTICS

Track browser family:

```text
Chrome
Safari
Firefox
Edge
Other
```

Do not store unnecessarily detailed browser fingerprints.

---

# 19. OPERATING SYSTEM ANALYTICS

Track:

```text
Windows
macOS
Linux
Android
iOS
Other
```

Keep the information at family level.

---

# 20. TRAFFIC CHART

Create a clean chart showing:

```text
Visitors
Sessions
Page Views
```

with the ability to switch metric.

Support:

```text
Daily
Weekly
```

depending on selected date range.

Avoid excessively complicated charts.

---

# 21. GROWTH ANALYTICS

Calculate:

```text
Current Period
Previous Equivalent Period
Percentage Change
```

Examples:

```text
Visitors ↑ 24%
Page Views ↑ 17%
Requests ↑ 31%
```

Handle:

```text
0 → positive
positive → 0
negative trends
missing data
```

correctly.

Do not generate misleading percentages.

---

# 22. SMART INSIGHTS

Create a lightweight:

```text
Insights
```

section.

Version 1 should be **rule-based**, not AI-powered.

Examples:

```text
Traffic increased 24% this week.

Your most viewed project is Ativar.

Contact requests increased 31%.

Mobile visitors represent 64% of traffic.

Contact conversion dropped 7%.

Google generated the highest number of contact requests.
```

Insights must only be generated when the underlying data supports the statement.

Never fabricate an insight.

---

# 23. SMART ALERTS

Create lightweight alerts:

```text
New Contact Request
Traffic Spike
Traffic Drop
Form Error Spike
Spam Spike
```

Example thresholds:

```text
Traffic change > 30%
Form error rate > 5%
Spam increase > 50%
```

Make thresholds configurable.

Do not build a complex alerting engine.

---

# 24. DAILY SUMMARY

Create:

```text
Today's Summary
```

Example:

```text
Visitors: 124
Views: 386
Requests: 4
Spam: 1
Top Project: Ativar
Top Source: Google
Conversion: 3.2%
```

This should be a simple aggregation.

---

# 25. WEEKLY SUMMARY

Provide:

```text
Weekly Growth
```

Example:

```text
Visitors ↑ 18%
Page Views ↑ 22%
Requests ↑ 25%
Spam ↓ 12%
```

Keep this lightweight.

---

# 26. CONTACT / LEAD INTELLIGENCE

The existing Contact Form is a core part of the system.

Do not replace it unnecessarily.

Extend the current architecture.

The Contact system should track:

```text
Form Views
Form Starts
Submission Attempts
Successful Submissions
Failed Submissions
Spam Submissions
Conversion Rate
Abandonment Rate
```

---

# 27. CONTACT REQUEST DASHBOARD

Create:

```text
/admin/contacts
```

This should be one of the most important admin pages.

Top-level metrics:

```text
Total Requests
New
Unread
Replied
Spam
```

---

# 28. CONTACT STATUS

Keep the status system intentionally small:

```text
NEW
READ
REPLIED
ARCHIVED
SPAM
```

Do not create:

```text
IN_PROGRESS
QUALIFIED
APPROVED
ASSIGNED
ESCALATED
```

unless a real need appears later.

---

# 29. CONTACT REQUEST TABLE

Columns:

```text
Status
Name
Email
Subject
Source
Created
```

Optional:

```text
Spam Status
```

Keep technical information out of the primary table.

---

# 30. CONTACT REQUEST DETAIL

When a request is opened, show:

### Contact

```text
Name
Email
Subject
Message
Created At
Status
```

### Attribution

```text
Source
Referrer
Landing Page
Project
Campaign
```

### Technical Information

```text
Device
Browser
OS
Country
```

Keep technical information in a collapsible section.

---

# 31. REQUEST SEARCH

Support search by:

```text
Name
Email
Subject
```

Do not initially implement full-text search across every analytics event.

---

# 32. REQUEST FILTERS

Support:

```text
All
New
Unread
Replied
Archived
Spam
```

and date filters:

```text
Today
7 Days
30 Days
Custom
```

---

# 33. RECENT REQUESTS

The main dashboard should display the latest requests.

Example:

```text
Omid
Frontend Development Inquiry
5 minutes ago
NEW
```

Clicking it should open the request detail.

---

# 34. NEW REQUEST INDICATOR

If new requests exist, show:

```text
🔔 3 New Requests
```

The indicator should update through normal refresh/revalidation.

Do NOT build WebSocket infrastructure just for this.

If necessary, use lightweight polling or standard Next.js revalidation.

---

# 35. REQUEST SOURCE

For each request, show:

```text
Direct
Google
Social
Referral
Campaign
Other
```

Where available.

---

# 36. PROJECT → LEAD ATTRIBUTION

This is a high-priority portfolio feature.

Track whether a visitor viewed a project before submitting the contact form.

Example:

```text
Home
 ↓
Projects
 ↓
Ativar
 ↓
Contact
 ↓
Submit
```

The Contact request should be associated with:

```text
Project Viewed
```

when confidently available.

Do not implement complex multi-touch attribution.

A simple project association is enough.

---

# 37. LEAD TIMELINE

For each request, provide a simple timeline:

```text
Visitor arrived
↓
Viewed Project
↓
Opened Contact Form
↓
Started Form
↓
Submitted Form
↓
Request Stored
↓
Email Sent
```

Only track meaningful events.

Do not record:

```text
Every mouse movement
Every keystroke
Every scroll event
```

---

# 38. FORM FUNNEL

Create:

```text
Form Views
      ↓
Form Starts
      ↓
Successful Submissions
```

Calculate:

```text
Start Rate
Submission Rate
Abandonment Rate
```

---

# 39. FORM ABANDONMENT

If a visitor starts the form but does not submit it:

count the anonymous event.

Do NOT store partially typed private content.

The system may store:

```text
Form Started
Last interaction timestamp
Page
Session
```

but never store raw incomplete message content for analytics.

---

# 40. FORM HEALTH

Create:

```text
Form Health
```

Example:

```text
Status: Healthy ✓

Successful submissions: 98.4%
Errors: 1.6%
Spam blocked: 12
```

Possible status:

```text
Healthy
Warning
Critical
```

---

# 41. FORM ERROR TRACKING

Categorize errors:

```text
VALIDATION_ERROR
RATE_LIMITED
SPAM_BLOCKED
SERVER_ERROR
EMAIL_ERROR
UNKNOWN_ERROR
```

Do not store private form content in error analytics.

---

# 42. SUBMISSION LIFECYCLE

Internally distinguish:

```text
Submission Result
```

from:

```text
Lead Status
```

For example:

```text
Lead Status:
NEW

Processing:
EMAIL_SENT
```

Potential processing states:

```text
RECEIVED
VALIDATED
STORED
EMAIL_PENDING
EMAIL_SENT
FAILED
SPAM
BLOCKED
```

Do not expose unnecessary internal states to the user.

---

# 43. EMAIL FAILURE HANDLING

A critical rule:

> Email failure must NOT cause the Contact request to disappear.

The request should be persisted first.

Then email notification should be processed.

If email delivery fails:

```text
Contact remains stored
Processing status = EMAIL_ERROR
```

The admin should still be able to see the request.

---

# 44. ANTI-SPAM ARCHITECTURE

The form must use layered protection.

Use:

```text
Server-side validation
+
Rate limiting
+
Honeypot
+
Timing analysis
+
Simple duplicate detection
+
Basic suspicious behavior scoring
```

CAPTCHA should NOT be the first layer.

If spam becomes a real problem later, add:

```text
Cloudflare Turnstile
```

or an equivalent low-friction challenge.

Do not add CAPTCHA unnecessarily to every real visitor.

---

# 45. HONEYPOT

Add a hidden honeypot field.

If populated:

```text
SPAM
```

should be detected.

The client must not receive a detailed explanation.

Do not tell the bot:

```text
Honeypot triggered
```

---

# 46. TIMING ANALYSIS

Measure time between:

```text
Form View
```

and:

```text
Submission
```

Extremely fast submissions should be marked:

```text
SUSPICIOUS
```

but timing alone must NOT automatically block a request.

---

# 47. SIMPLE SPAM SCORE

Create a lightweight score:

```text
0–29    LEGITIMATE
30–59   SUSPICIOUS
60–100  SPAM
```

These thresholds should be configurable.

Potential signals:

```text
Honeypot triggered
Too-fast submission
Rate limit violation
Repeated submission
Suspicious user-agent
Duplicate request
```

Do not build machine learning.

---

# 48. SPAM DASHBOARD

Create:

```text
/admin/security
```

Show:

```text
Spam Requests
Blocked Requests
Suspicious Requests
Spam Rate
Rate Limit Hits
Form Errors
```

Keep the page small.

It is not a SOC dashboard.

---

# 49. SPAM REVIEW

Admin should be able to:

```text
Mark as Spam
Mark as Legitimate
Archive
```

Avoid aggressive automatic deletion.

A suspicious request should remain reviewable.

---

# 50. DUPLICATE DETECTION

Detect likely duplicates using a combination of:

```text
Email
Message similarity/hash
Short time window
Repeated submission
```

Do not automatically delete duplicate requests.

Mark them as:

```text
Potential Duplicate
```

---

# 51. SERVER-SIDE VALIDATION

All form data must be validated on the server.

At minimum:

```text
Name
Email
Subject
Message
```

must have:

```text
Required validation
Length limits
Format validation
Safe normalization
```

The existing `contactSchema` should be reused or extended rather than replaced unnecessarily.

---

# 52. XSS PROTECTION

The Contact form must resist payloads such as:

```html
<script>alert(1)</script>
```

and similar malicious HTML/JS payloads.

Also protect against common variants such as:

```html
<img src=x onerror=...>
<svg onload=...>
javascript:
```

Do not rely solely on client-side sanitization.

---

# 53. SAFE RENDERING

User-generated values must be treated as plain text.

Do not use:

```text
dangerouslySetInnerHTML
```

for contact content unless there is a compelling reason and proper sanitization is applied.

Prefer safe text rendering.

---

# 54. EMAIL TEMPLATE SECURITY

User input inserted into emails must be escaped.

A visitor must never be able to inject arbitrary HTML into the email template.

Treat:

```text
Name
Subject
Message
```

as untrusted content.

---

# 55. CLIENT DATA IS UNTRUSTED

Never trust client-provided:

```text
isSpam
spamScore
visitorId
sessionId
timestamp
userAgent
source
```

The server must validate and normalize values.

The server is the source of truth.

---

# 56. RATE LIMITING

Reuse the existing rate limiter.

Apply appropriate protection to:

```text
POST /api/contact
```

At minimum protect against repeated submissions.

Do not create a complicated distributed rate-limit system unless the existing infrastructure requires it.

---

# 57. SECURITY LOGGING

Track security events such as:

```text
SPAM_DETECTED
RATE_LIMIT_TRIGGERED
INVALID_PAYLOAD
SUSPICIOUS_REQUEST
BLOCKED_REQUEST
```

Do not store sensitive form content inside security logs.

---

# 58. PRIVACY

Do not put message content inside analytics events.

Good:

```text
CONTACT_FORM_SUBMIT
```

Bad:

```text
{
  event: "CONTACT_FORM_SUBMIT",
  message: "private user message..."
}
```

Do not store:

```text
Keystrokes
Passwords
Sensitive information
Full persistent fingerprints
Unnecessary personal identifiers
```

Analytics and Contact data must remain logically separate.

---

# 59. DATA RETENTION

Suggested initial retention:

```text
Raw analytics events: 90 days
Security events: 30–90 days
Aggregated metrics: long-term
Contact requests: retained until manually archived/deleted
```

Make retention configurable.

Do not build an elaborate retention service for the MVP.

---

# 60. DATABASE ARCHITECTURE

Keep the database intentionally small.

Preferred conceptual models:

```text
Visitor
Session
AnalyticsEvent
Contact
```

Optional:

```text
DailyMetric
SecurityEvent
```

Do NOT automatically create separate tables for:

```text
Browser
Device
Country
TrafficSource
ProjectAnalytics
FormAnalytics
LeadAttribution
```

unless actual query patterns demonstrate that they are necessary.

Prefer simple fields and aggregation where practical.

---

# 61. DAILY METRICS

If needed for performance, create:

```text
DailyMetric
```

with fields such as:

```text
date
visitors
sessions
pageViews
contacts
spam
```

This prevents the dashboard from repeatedly scanning large raw event datasets.

Do not prematurely optimize.

Only introduce aggregation where it provides a clear benefit.

---

# 62. ANALYTICS PERFORMANCE

The dashboard must remain fast.

Avoid:

```text
N+1 queries
```

Avoid loading all analytics events into memory.

Use:

```text
Database aggregation
Indexed queries
Pagination
Date filtering
Cached summaries
```

where appropriate.

---

# 63. CONTACT PERFORMANCE

Contact requests must use pagination.

Do not load thousands of requests into the browser.

Example:

```text
20 / 50 / 100 per page
```

with server-side pagination.

---

# 64. CSV EXPORT

Provide lightweight export for:

```text
Contacts
Analytics Summary
```

CSV is sufficient.

Do not implement PDF/Excel reporting unless explicitly requested.

---

# 65. AUTHENTICATION

All `/admin/*` routes must be protected.

Analytics and Contact information must never be publicly accessible.

Use a secure server-side authentication/session mechanism appropriate for the existing project.

Do not expose private analytics through client-side public APIs.

---

# 66. AUTHORIZATION

For MVP:

```text
ADMIN
```

is enough.

However, structure the authorization layer so roles can be added later.

Do NOT build a complete enterprise RBAC system now.

---

# 67. ADMIN API DESIGN

Use clear server-side API boundaries.

Potential endpoints:

```text
/api/analytics/overview
/api/analytics/events
/api/analytics/pages
/api/analytics/projects
/api/analytics/traffic

/api/contacts
/api/contacts/[id]

/api/security/overview
```

Only create endpoints that are actually used.

Prefer server components/server actions where appropriate rather than unnecessary APIs.

---

# 68. ANALYTICS COLLECTION

Analytics collection should have minimal performance impact on the public website.

Do not block page rendering on analytics.

Analytics failures must NOT break the portfolio.

Example principle:

```text
Analytics fails
      ↓
Website continues working normally
```

---

# 69. PUBLIC WEBSITE RESILIENCE

The analytics layer must never become a single point of failure.

If:

```text
Database unavailable
Analytics unavailable
Tracking request fails
```

the portfolio should still render normally.

Contact functionality should remain as independent as practical.

---

# 70. ADMIN UI COMPONENTS

Build reusable components:

```text
DashboardCard
MetricCard
TrendIndicator
DateRangePicker
AnalyticsChart
DataTable
StatusBadge
RequestCard
RequestDetail
Timeline
InsightCard
AlertCard
EmptyState
LoadingState
ErrorState
```

Do not duplicate UI logic across pages.

---

# 71. RESPONSIVE DESIGN

Dashboard must work well on:

```text
Desktop
Laptop
Tablet
Mobile
```

Desktop should be the primary admin experience.

Mobile should still allow:

```text
View metrics
Read contact requests
Change request status
Check alerts
```

---

# 72. ACCESSIBILITY

Follow reasonable accessibility standards:

```text
Keyboard navigation
Focus states
Semantic HTML
ARIA where appropriate
Readable contrast
Accessible charts/data summaries
```

Charts must not be the only way to understand important data.

---

# 73. LOADING STATES

Every data-heavy dashboard section needs:

```text
Skeleton
Loading
Empty
Error
Success
```

states.

Do not show blank screens while data loads.

---

# 74. ERROR HANDLING

Analytics errors should be isolated.

If the Projects analytics query fails:

the Contact Requests section should still work.

If one card fails:

do not crash the entire dashboard.

Use localized error boundaries where appropriate.

---

# 75. CACHING / REVALIDATION

Use Next.js caching and revalidation intelligently.

Do not introduce Redis caching everywhere.

Cache expensive summaries where useful.

Real-time data such as new Contact requests can use:

```text
revalidation
polling
manual refresh
```

rather than WebSockets.

---

# 76. TESTING

Add tests for critical functionality.

At minimum:

### Contact

```text
Valid submission
Invalid email
Missing fields
Maximum length
XSS payload
Honeypot
Rate limiting
Spam detection
Duplicate detection
```

### Analytics

```text
Page view
Project view
Contact form view
Contact submission
Conversion calculation
Growth calculation
```

### Security

```text
Unauthorized admin access
Invalid payload
Rate limit
XSS
Spam classification
```

---

# 77. SECURITY TEST CASES

Explicitly test:

```html
<script>alert('x')</script>
```

```html
<img src=x onerror=alert(1)>
```

```html
<svg onload=alert(1)>
```

```text
javascript:alert(1)
```

and long malicious payloads.

Verify that they:

```text
Never execute
Never break the UI
Are safely stored/rendered
Do not compromise email templates
```

---

# 78. FORM UX

Anti-spam must remain invisible to legitimate users whenever possible.

Preferred sequence:

```text
Server Validation
      ↓
Rate Limit
      ↓
Honeypot
      ↓
Timing
      ↓
Risk Score
      ↓
Optional CAPTCHA only if necessary
```

Do not make a real visitor solve CAPTCHA unnecessarily.

---

# 79. AI — NOT REQUIRED FOR MVP

The architecture may eventually support AI-generated insights.

However:

### DO NOT add an AI API in the first implementation unless explicitly requested.

The first version should use deterministic rules.

Future possibilities:

```text
AI Weekly Summary
AI Traffic Explanation
AI Lead Classification
AI Content Suggestions
```

But keep them out of MVP.

---

# 80. OPTIONAL FUTURE FEATURES

Architecture may leave room for:

```text
AI Insights
Telegram Notifications
Advanced SEO Analytics
Advanced Attribution
Heatmaps
Session Replay
Advanced Bot Detection
CRM Integration
```

But do NOT implement them now.

---

# 81. NAVIGATION — FINAL

Use:

```text
Dashboard

Analytics
  Overview
  Visitors
  Pages
  Traffic
  Devices
  Projects

Contacts

Security

Settings
```

This is the final MVP navigation.

---

# 82. FINAL MVP FEATURE MATRIX

## Dashboard

```text
✓ Visitors
✓ Sessions
✓ Page Views
✓ Contact Requests
✓ Conversion Rate
✓ Growth
✓ Traffic Chart
✓ Top Pages
✓ Top Projects
✓ Traffic Sources
✓ Devices
✓ Browsers
✓ Recent Requests
✓ Form Health
✓ Insights
✓ Alerts
```

## Analytics

```text
✓ Visitor Analytics
✓ Session Analytics
✓ Page Analytics
✓ Traffic Sources
✓ Device Analytics
✓ Browser Analytics
✓ OS Analytics
✓ Project Analytics
✓ Growth Comparison
```

## Contacts

```text
✓ Request List
✓ Request Search
✓ Request Filters
✓ Request Detail
✓ Status
✓ Source
✓ Project Association
✓ Lead Timeline
✓ New Request Indicator
✓ CSV Export
```

## Security

```text
✓ Rate Limiting
✓ Server Validation
✓ Honeypot
✓ Timing Detection
✓ Spam Score
✓ Duplicate Detection
✓ XSS Protection
✓ Security Events
✓ Spam Review
✓ Form Error Monitoring
```

---

# 83. DEFINITION OF DONE

The implementation is considered complete when the following flow works:

```text
Visitor
   ↓
Portfolio Website
   ↓
Page View
   ↓
Project View
   ↓
Contact Form
   ↓
Server Validation
   ↓
Anti-Spam
   ↓
Contact Stored
   ↓
Analytics Updated
   ↓
Email Notification
   ↓
Admin Dashboard
```

And the admin can answer:

```text
How many visitors came today?

Where did they come from?

What did they view?

Which project was most popular?

How many contact requests arrived?

Who submitted them?

Which requests are new?

Which requests have been replied to?

How many submissions were spam?

Is the contact form healthy?

Is traffic growing?

Are leads growing?

What is the most important change?
```

---

# 84. IMPLEMENTATION ORDER

Do NOT implement everything randomly.

Follow this sequence.

## Phase 0 — Audit

Before coding:

1. Inspect the complete repository.
2. Inspect package.json.
3. Inspect existing routing.
4. Inspect ContactForm.
5. Inspect contactSchema.
6. Inspect `/api/contact`.
7. Inspect email service.
8. Inspect rateLimiter.
9. Inspect environment variables.
10. Inspect database setup if present.
11. Inspect deployment assumptions.
12. Identify existing dependencies that can be reused.

Produce a short internal architecture assessment before implementation.

Do not modify code during the audit phase unless necessary.

---

## Phase 1 — Foundation

Implement:

```text
Admin authentication
Admin layout
Sidebar
Dashboard shell
Shared UI components
Date range infrastructure
Database foundation
```

---

## Phase 2 — Analytics

Implement:

```text
Visitor tracking
Session tracking
Page views
Project views
Traffic sources
Device/browser detection
Analytics events
```

Keep collection lightweight.

---

## Phase 3 — Dashboard

Implement:

```text
KPI cards
Traffic chart
Growth comparison
Top pages
Top projects
Traffic sources
Devices
Daily summary
Insights
```

---

## Phase 4 — Contacts

Integrate existing Contact architecture.

Implement:

```text
Contact storage
Contact dashboard
Status
Search
Filters
Detail
Recent requests
Project attribution
Lead timeline
```

---

## Phase 5 — Security

Implement:

```text
Server validation
XSS protection
Honeypot
Rate limiting
Timing analysis
Spam scoring
Duplicate detection
Security events
```

---

## Phase 6 — Form Intelligence

Implement:

```text
Form views
Form starts
Successful submissions
Errors
Conversion
Abandonment
Form health
```

---

## Phase 7 — Polish

Implement:

```text
Loading states
Empty states
Error states
Responsive behavior
Accessibility
Animations
Charts polish
Performance optimization
```

---

## Phase 8 — Testing

Run:

```text
Lint
Typecheck
Unit tests
Integration tests
Build
Security tests
```

Fix all critical issues before considering the implementation complete.

---

# 85. DATABASE PRINCIPLES

Before creating migrations:

1. Inspect whether a database already exists.
2. Reuse the existing database if appropriate.
3. Avoid duplicate models.
4. Use indexes for common queries.
5. Use timestamps consistently.
6. Use enums where they improve integrity.
7. Use nullable fields only when semantically meaningful.
8. Do not store redundant analytics data unnecessarily.

---

# 86. ENVIRONMENT VARIABLES

All secrets must remain server-side.

Examples:

```text
DATABASE_URL
ADMIN_SECRET
EMAIL_API_KEY
RATE_LIMIT_REDIS_URL
RATE_LIMIT_REDIS_TOKEN
```

Use the existing environment conventions where available.

Never expose secrets through:

```text
NEXT_PUBLIC_*
```

unless they are genuinely public.

---

# 87. LOGGING

Logs should be:

```text
Useful
Structured
Minimal
Privacy-aware
```

Do not log:

```text
Passwords
Full private messages
API keys
Authentication secrets
Sensitive personal data
```

---

# 88. CODE QUALITY

Follow:

```text
TypeScript strictness
Small functions
Single responsibility
Reusable components
Clear naming
No unnecessary abstractions
No duplicated logic
No dead code
```

Avoid:

```text
Any
Massive components
God functions
Hardcoded magic values
Duplicated query logic
```

---

# 89. DEPENDENCY POLICY

Before adding a package:

Ask:

> Can this be implemented cleanly with the existing stack?

If yes:

**Do not add a dependency.**

Only add dependencies when they provide meaningful value.

Do not install a large analytics framework simply to track a few events.

---

# 90. EXISTING DESIGN SYSTEM

Respect the existing portfolio design.

The README indicates the existing palette is approximately:

```text
Background: #020617
Surface:    #0f172a
Accent:     #3b82f6
Text:       #f1f5f9
Muted:      #94a3b8
```

Use the existing visual language where appropriate.

Do not redesign the public portfolio just because the admin dashboard is being added.

---

# 91. ANIMATION

Use existing:

```text
Framer Motion
GSAP
```

only where appropriate.

Dashboard animations should be subtle.

Do NOT animate every metric or table row.

Prioritize usability and performance.

---

# 92. PERFORMANCE BUDGET

The public website must remain fast.

Analytics code should:

```text
Load asynchronously
Avoid blocking rendering
Avoid large client bundles
Fail silently where appropriate
```

The admin dashboard may use richer client-side components, but keep the bundle reasonable.

---

# 93. PUBLIC / ADMIN SEPARATION

Clearly separate:

```text
Public Portfolio
```

from:

```text
Admin Dashboard
```

Admin code should not unnecessarily increase the public bundle.

Use server components where possible.

---

# 94. NO UNNECESSARY REAL-TIME

Real-time is not a requirement.

For:

```text
New Contact Requests
Active Visitors
```

prefer:

```text
Revalidation
Manual refresh
Lightweight polling
```

before WebSockets.

If real-time introduces significant architectural complexity:

**do not implement it.**

---

# 95. ANALYTICS FAILURE POLICY

If analytics fails:

```text
Portfolio continues working.
```

If analytics database fails:

```text
Contact form should remain operational whenever practical.
```

If analytics endpoint fails:

```text
Do not show an error to public visitors.
```

---

# 96. CONTACT FAILURE POLICY

Contact submission is more important than analytics.

Priority:

```text
1. Validate request
2. Persist request
3. Process notification
4. Record analytics
```

Never allow analytics failure to destroy a valid Contact submission.

---

# 97. FINAL ARCHITECTURAL PRINCIPLE

The final architecture should look conceptually like:

```text
                    GHANBARIOMID.IR
                          │
              ┌───────────┴───────────┐
              │                       │
          Public Site              Admin
              │                       │
              ▼                       ▼
        Lightweight Events       Dashboard
              │                       │
              ▼                       ├── Analytics
         Analytics Store              ├── Contacts
              │                       ├── Security
              │                       └── Settings
              │
              ▼
        Daily Aggregation
```

Contact flow:

```text
Visitor
   │
   ▼
Contact Form
   │
   ▼
Server Validation
   │
   ├──── Rate Limit
   ├──── Honeypot
   ├──── Timing
   ├──── Spam Score
   └──── Duplicate Detection
   │
   ▼
Store Contact
   │
   ├──────────────► Analytics
   │
   └──────────────► Email Notification
```

---

# 98. MOST IMPORTANT RULE

Do not optimize for the number of features.

Optimize for:

```text
Signal
Reliability
Security
Speed
Maintainability
```

This is a personal website.

A dashboard with 20 excellent metrics is better than a dashboard with 200 noisy metrics.

---

# FINAL INSTRUCTION TO THE CODING AGENT

Do not start by blindly creating files.

First:

```text
1. Audit the existing repository.
2. Understand the current architecture.
3. Identify reusable infrastructure.
4. Identify missing infrastructure.
5. Propose the smallest architecture capable of supporting this specification.
6. Implement incrementally.
7. Preserve existing functionality.
8. Test every critical path.
9. Run lint/typecheck/build.
10. Verify security.
11. Verify mobile responsiveness.
12. Verify that analytics failure cannot break the public website.
13. Verify that Contact failure handling does not lose requests.
14. Verify that user-generated content cannot execute scripts.
15. Verify that private analytics cannot be accessed without authentication.
```

Do not make unnecessary architectural changes.

Do not introduce enterprise-level complexity.

Do not invent features outside this specification.

If an implementation decision has two valid options, prefer the one with:

```text
Less code
Fewer dependencies
Fewer moving parts
Lower maintenance cost
Better security
Better performance
```

The final result must be:

> **A premium, lightweight, secure, privacy-aware Personal Intelligence Dashboard for ghanbariomid.ir — powerful enough to understand visitors and leads, but intentionally small enough to maintain as a personal project.**
---
name: analytics-engineering
description: Design and implement lightweight, privacy-aware analytics for ghanbariomid.ir. Use when creating events, visitors, sessions, metrics, attribution, aggregation, dashboard queries, or analytics APIs.
---

# Analytics Engineering Skill

## Purpose

Build reliable analytics that answer useful questions about visitors and leads without becoming a Google Analytics clone.

The analytics system must remain lightweight, privacy-aware, fast, and maintainable.

## Core Principle

Optimize for signal, reliability, security, speed, and maintainability.

A small number of trustworthy metrics is better than a large number of noisy metrics.

## Required Analytics Concepts

Support only concepts that provide clear product value:

- Visitor
- Session
- Page view
- Project view
- Traffic source
- Device
- Browser
- OS
- Referrer
- UTM attribution
- Contact form view
- Contact form start
- Contact submission
- Successful contact
- Form error
- Outbound click where useful

## Event Design

Every event must have:

- stable event name
- timestamp
- visitor/session association where available
- relevant path/page
- optional project association
- minimal metadata
- server-side validation
- privacy-aware storage

Do not collect unnecessary personal data.

Do not store raw request payloads as analytics events.

Do not collect keystrokes, mouse movement, session replay, or invasive fingerprinting.

## Metric Definition Rule

Before implementing a metric, define:

1. Name
2. Meaning
3. Source event(s)
4. Calculation
5. Time window
6. Aggregation strategy
7. Edge cases

Examples:

### Conversion Rate

Successful contact submissions divided by the chosen contact-form exposure denominator.

The exact denominator must be documented and used consistently.

### Project Conversion

Successful contacts attributed to a project divided by project views for the same attribution rule and time window.

Do not silently change metric definitions between pages.

## Shared Calculations

Create reusable utilities for common calculations.

Example:

`calculatePercentageChange(current, previous)`

Do not duplicate percentage-change, conversion, date-range, or aggregation logic across dashboard pages.

## Visitor and Session Rules

Use the simplest reliable visitor/session model supported by the existing project.

Document:

- how anonymous visitors are identified
- how sessions are created
- session timeout behavior
- returning visitor behavior
- attribution lifetime

Do not introduce invasive fingerprinting simply to improve uniqueness.

## Attribution

Prefer simple attribution.

For project-to-lead attribution:

- record relevant project views
- associate a contact with the most appropriate recent project context
- document the attribution rule

Do not implement multi-touch attribution unless explicitly requested.

## Data Flow

Prefer:

Public website
→ lightweight tracking
→ analytics store
→ aggregation/query layer
→ admin dashboard

Analytics must never block public page rendering.

Analytics failure must never break the public website.

## Aggregation

Do not repeatedly scan large raw event datasets for every dashboard request.

Where useful, use:

- indexed queries
- database aggregation
- date filtering
- pagination
- cached summaries
- daily/hourly aggregation

Keep aggregation re-runnable.

Do not prematurely introduce a data warehouse, streaming platform, or complex event pipeline.

## Dashboard Query Rules

- Use server-side queries.
- Avoid N+1 queries.
- Do not load all events into browser memory.
- Use pagination for large lists.
- Keep date filters explicit.
- Return only fields needed by the UI.
- Keep analytics APIs private.

## Real-Time

Do not build WebSocket infrastructure for MVP.

If near-real-time information is useful, prefer lightweight refresh/revalidation or short polling only where justified.

## Performance Metrics

Performance analytics may include useful lightweight metrics such as:

- page load performance
- Core Web Vitals where collection is practical
- slow pages
- 404 errors
- 5xx errors

Do not build a full observability platform.

## Data Quality

Before considering analytics complete, verify:

- event counts are plausible
- duplicate events are controlled
- date boundaries are correct
- timezone handling is consistent
- failed analytics writes do not break the site
- metric definitions match displayed calculations

## Privacy

Minimize collection.

Do not store:
- passwords
- authentication secrets
- unnecessary PII
- full private form payloads as analytics
- invasive behavioral recordings

Analytics data must remain private and authenticated.

## Final Principle

Every metric must answer a useful question.

If a metric does not support a meaningful product or business decision, do not add it merely because it is technically possible.

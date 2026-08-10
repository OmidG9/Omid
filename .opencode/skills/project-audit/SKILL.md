---
name: project-audit
description: Audit an existing Next.js/TypeScript project before implementation. Use before modifying architecture, database, APIs, dependencies, or core features. Produces an evidence-based architecture assessment and implementation plan without changing code during the audit phase.
---

# Project Audit Skill

## Purpose

Perform a disciplined repository audit before implementing the Personal Intelligence Dashboard for ghanbariomid.ir.

The audit exists to prevent unnecessary rewrites, duplicate infrastructure, accidental regressions, and enterprise-level overengineering.

## Mandatory Rules

1. Do not start by creating files.
2. Do not modify code during the audit phase unless a tiny read-only-safe diagnostic change is genuinely required.
3. Inspect the existing implementation before proposing replacements.
4. Reuse existing infrastructure whenever appropriate.
5. Do not introduce dependencies until the existing stack has been evaluated.
6. Do not invent architecture that the repository does not need.
7. Preserve existing public-site behavior.
8. Keep the final architecture intentionally small.

## Audit Order

Inspect, in this order where applicable:

1. Repository structure
2. `package.json`
3. Lockfile
4. Next.js version and routing
5. App Router / Pages Router usage
6. Existing layouts and providers
7. Existing UI/design system
8. Contact form implementation
9. Contact schema/validation
10. Contact API / server action
11. Email service
12. Rate limiter
13. Authentication/session implementation
14. Database configuration
15. Prisma schema and migrations
16. Existing analytics or tracking
17. Environment variables and configuration
18. Middleware
19. Error handling
20. Deployment assumptions
21. Existing tests
22. Existing dependencies that can be reused

## Audit Questions

Answer internally:

- What already exists?
- What can be reused?
- What is missing?
- What should not be changed?
- Which proposed feature is already partially implemented?
- Which database models already exist?
- Which API boundaries already exist?
- Which dependencies are unnecessary?
- Could the feature be implemented with existing Next.js/TypeScript/Prisma capabilities?
- What is the smallest architecture capable of supporting the specification?

## Required Audit Output

Before implementation, produce a concise architecture assessment containing:

### Existing Architecture
- Framework
- Routing
- Data layer
- Authentication
- Contact flow
- Email
- Rate limiting
- Styling/UI
- Testing
- Deployment

### Reusable Infrastructure
List existing components/services/utilities that should be reused.

### Gaps
List only capabilities actually missing for the requested implementation.

### Risks
Identify:
- breaking changes
- migration risks
- security risks
- performance risks
- privacy risks
- dependency risks

### Minimal Implementation Plan
Describe the smallest safe implementation path.

## Decision Rule

When two valid approaches exist, prefer the one with:

- less code
- fewer dependencies
- fewer moving parts
- lower maintenance cost
- better security
- better performance
- easier rollback

## Stop Conditions

Do not proceed to implementation if the repository audit reveals a critical ambiguity about:

- existing database ownership
- authentication
- contact persistence
- destructive migration requirements
- production deployment assumptions

Ask for clarification only when the ambiguity cannot be resolved safely from the repository.

## Final Principle

This is a personal website.

Do not turn the repository into an enterprise analytics platform merely because the specification contains advanced concepts.

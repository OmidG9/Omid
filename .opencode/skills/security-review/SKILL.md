---
name: security-review
description: Apply security and privacy controls to the ghanbariomid.ir Personal Intelligence Dashboard, Contact flow, analytics collection, admin routes, APIs, authentication, and environment configuration.
---

# Security Review Skill

## Purpose

Treat security as a cross-cutting requirement, not a final checklist.

The system contains private analytics and contact information, so public and administrative boundaries must remain strictly separated.

## Threat Model

Consider at minimum:

- unauthorized admin access
- brute-force authentication
- CSRF
- XSS
- malicious form input
- spam
- duplicate submissions
- rate-limit abuse
- bot traffic
- malicious user agents
- API abuse
- secret exposure
- information leakage
- unsafe logs
- analytics poisoning
- unauthorized access to contact data

## Authentication

All admin routes must be protected.

Private analytics and contact data must never be publicly accessible.

Use the existing project's secure server-side authentication/session mechanism when appropriate.

Do not create a second authentication system if one already exists.

## Authorization

For MVP, a single ADMIN role is sufficient.

Keep authorization structured so additional roles can be introduced later.

Do not build enterprise RBAC unless explicitly requested.

## Contact Security Pipeline

Preferred order:

1. Server validation
2. Rate limiting
3. Honeypot
4. Timing analysis
5. Risk/spam scoring
6. Optional CAPTCHA only if genuinely necessary
7. Persist valid contact
8. Process notification
9. Record analytics

Legitimate users should not be burdened with unnecessary CAPTCHA.

## Contact Persistence

Persistence must be more reliable than notification.

The priority is:

Validate request
→ persist request
→ process email/notification
→ record analytics

An email failure must not cause a valid contact request to disappear.

Analytics failure must not invalidate a valid contact request.

## Input Validation

Validate all untrusted input on the server.

Use the existing schema-validation approach where available.

Validate:

- type
- length
- format
- allowed values
- required fields
- content constraints

Never rely solely on client-side validation.

## XSS

Treat all user-generated content as untrusted.

Prevent:

- HTML injection
- script execution
- unsafe HTML rendering
- unsafe URL handling

Do not render user content as raw HTML unless it is explicitly sanitized with an appropriate trusted mechanism.

## CSRF

Protect state-changing operations according to the existing application architecture.

Do not add redundant mechanisms that conflict with framework-native protections.

## Rate Limiting

Rate-limit:

- authentication attempts
- contact submission
- analytics ingestion where abuse is possible
- sensitive admin endpoints

Reuse the existing rate-limiter infrastructure if present.

## Spam Detection

Prefer layered, explainable signals:

- honeypot
- submission timing
- repeated submissions
- rate-limit violations
- suspicious user agent
- duplicate detection

Keep the scoring deterministic for MVP.

Do not add external AI spam APIs unless explicitly requested.

## Secrets

Secrets must remain server-side.

Never expose private values through public environment variables.

Never commit:

- passwords
- API keys
- JWT secrets
- database credentials
- email credentials
- private tokens

Never log secrets.

## Logging

Logs should be:

- useful
- structured
- minimal
- privacy-aware

Never log:

- passwords
- API keys
- authentication secrets
- full private messages
- unnecessary sensitive personal data

## Analytics Security

Analytics endpoints must be resilient against:

- event flooding
- malformed payloads
- unauthorized reads
- forged administrative requests
- excessive metadata

Do not trust client-supplied values blindly.

## Security Events

Where the existing architecture supports it, record useful security events such as:

- rate-limit violations
- suspicious submissions
- authentication failures
- blocked spam
- important admin security actions

Avoid turning this into a full SIEM.

## Dependency Security

Before adding a dependency:

1. Check whether existing dependencies already solve the problem.
2. Prefer small, maintained packages.
3. Avoid large security frameworks for small requirements.
4. Review the package's role and attack surface.

## Security Review Checklist

Before completion verify:

- admin routes are protected
- private APIs are protected
- server validation exists
- rate limiting works
- XSS protections exist
- secrets remain server-side
- logs do not leak secrets
- contact persistence survives email failure
- analytics failure cannot break the public website
- user-generated content cannot execute scripts

## Final Principle

Security controls should be strong, understandable, and proportional to a personal project.

Do not introduce enterprise security complexity without a concrete threat or requirement.

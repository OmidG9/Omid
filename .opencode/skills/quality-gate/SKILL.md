---
name: quality-gate
description: Validate implementation quality for the ghanbariomid.ir dashboard before completion. Use after features are implemented and before declaring work complete. Covers type safety, lint, tests, build, performance, accessibility, resilience, security, and regression checks.
---

# Quality Gate Skill

## Purpose

Prevent the coding agent from declaring the Personal Intelligence Dashboard complete merely because the code compiles.

Completion requires functional, architectural, security, performance, and regression validation.

## Execution Order

After implementation:

1. Typecheck
2. Lint
3. Unit tests
4. Integration tests
5. Security-focused tests
6. Build
7. Review critical paths
8. Verify public-site resilience
9. Verify responsive behavior
10. Verify accessibility basics
11. Review changed files
12. Check for unnecessary dependencies
13. Check for dead/duplicated code

Use the project's existing scripts where available.

Typical commands:

```bash
npm run lint
npm run build
npm test
```

Also run the project's typecheck command if one exists.

Do not invent commands that are not supported by the repository.

## Type Safety

No new avoidable TypeScript errors.

Avoid:

- `any`
- unsafe casts
- duplicated types
- untyped API boundaries
- silently ignored errors

Prefer explicit domain types and schema-derived types where appropriate.

## Functional Critical Paths

Verify the complete flow:

Visitor
→ Portfolio
→ Page View
→ Project View
→ Contact Form
→ Server Validation
→ Anti-Spam
→ Contact Stored
→ Analytics Updated
→ Email Notification
→ Admin Dashboard

The implementation is not complete if a critical step silently breaks.

## Contact Resilience

Test:

### Valid submission
Contact is persisted and notification is processed.

### Validation failure
Invalid input is rejected safely.

### Spam
Spam is blocked according to configured rules.

### Duplicate
Duplicate behavior is deterministic.

### Email failure
Contact remains persisted.

### Analytics failure
Contact remains valid and the public website continues working.

## Analytics Validation

Verify:

- events are recorded correctly
- visitor/session association works
- page views are correct
- project views are correct
- contact events are correct
- date filters are correct
- previous-period comparison is correct
- conversion calculations are correct
- empty datasets render correctly
- duplicate events are controlled

Do not accept plausible-looking numbers without checking their source.

## Database Validation

Check:

- migrations
- indexes
- relations
- nullable fields
- uniqueness constraints
- query performance
- pagination
- aggregation
- N+1 queries

Do not add a new model simply to solve a problem that can be handled by existing fields or aggregation.

## Security Validation

Verify:

- protected admin routes
- protected private APIs
- input validation
- rate limiting
- XSS protection
- secret handling
- safe logging
- CSRF protections where applicable
- authorization boundaries

## Performance Validation

Verify:

- analytics does not block public rendering
- dashboard queries are bounded
- large datasets are paginated
- unnecessary client-side data loading is avoided
- no obvious N+1 queries exist
- no unnecessary heavy dependency was introduced
- charts do not render massive datasets directly

Do not optimize prematurely, but fix obvious architectural performance problems.

## UI Validation

Check:

- loading states
- empty states
- error states
- responsive behavior
- keyboard usability
- accessible labels
- reasonable contrast
- no layout-breaking long content
- usable tables on smaller screens

Desktop is the primary admin experience, but mobile must remain useful.

## Regression Check

Confirm that existing functionality still works.

At minimum inspect:

- homepage
- projects
- navigation
- contact form
- email flow
- existing APIs
- authentication
- deployment/build

Do not accept a dashboard implementation that damages the portfolio.

## Dependency Review

For every newly added dependency ask:

- Was it actually necessary?
- Could the existing stack do this?
- Does it materially reduce complexity?
- Does it introduce maintenance or security cost?

Remove unnecessary dependencies before completion.

## Code Quality

Look for:

- duplicated logic
- massive components
- god functions
- dead code
- unused imports
- hardcoded values
- inconsistent naming
- unnecessary abstractions
- client components where server components would suffice

Prefer small, composable, readable code.

## Final Report

Before declaring completion, report:

### Passed
What was verified successfully.

### Failed
What remains broken.

### Warnings
Non-blocking concerns.

### Changed
High-level summary of implementation.

### Commands
Commands actually executed and their results.

Never claim a test, build, audit, or security review was run if it was not actually run.

## Definition of Done

The feature is complete only when:

- implementation works
- critical paths work
- typecheck passes
- lint passes
- build passes
- relevant tests pass
- security checks pass
- public-site functionality is preserved
- analytics failure cannot break the public website
- contact persistence survives notification failure
- private analytics cannot be accessed without authentication
- no unnecessary enterprise complexity was introduced

## Final Principle

Do not optimize for the number of completed features.

Optimize for:

- correctness
- reliability
- security
- performance
- maintainability
- trustworthy analytics

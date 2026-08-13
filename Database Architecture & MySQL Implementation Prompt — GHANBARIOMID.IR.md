# DATABASE ARCHITECTURE & MYSQL IMPLEMENTATION PROMPT
## GHANBARIOMID.IR — PERSONAL INTELLIGENCE DASHBOARD

You are responsible for designing and implementing the production-ready database architecture for the GHANBARIOMID.IR Personal Intelligence Dashboard.

The database must be designed from the actual requirements of the existing repository and the Master Prompt.

Do NOT blindly copy a predefined schema.

The goal is to design the smallest correct, normalized, performant, secure, and maintainable MySQL database capable of supporting the complete required MVP.

---

# 1. PRIMARY OBJECTIVE

Design and implement the database for:

- Visitor Analytics
- Session Analytics
- Page Analytics
- Project Analytics
- Traffic Sources
- Device / Browser / OS Analytics
- Contact Requests
- Contact Form Health
- Lead / Contact Timeline
- Project-to-Contact Attribution
- Daily Metrics
- Security Events
- Spam Detection
- Admin Dashboard
- Growth Comparison
- Analytics Insights
- Alerts
- Future extensibility without premature complexity

The database belongs to a personal portfolio website.

DO NOT turn it into an enterprise analytics platform.

---

# 2. FIRST STEP — REPOSITORY AUDIT

Before creating or modifying any database structure:

Inspect the complete repository.

Inspect at minimum:

- package.json
- package-lock.json / pnpm-lock.yaml / yarn.lock
- Next.js configuration
- existing database configuration
- existing Prisma configuration
- existing Prisma schema
- existing migrations
- existing models
- existing API routes
- existing Server Actions
- ContactForm
- contactSchema
- `/api/contact`
- email service
- rate limiting implementation
- authentication/session implementation
- analytics/tracking implementation
- existing project/portfolio data models
- environment configuration
- deployment configuration

Determine:

1. Whether a database already exists.
2. Whether Prisma is already used.
3. Whether the existing schema contains reusable models.
4. Whether migrations already exist.
5. Which tables must be preserved.
6. Which fields are already consumed by application code.
7. Which relationships already exist.
8. Which database changes are additive and which are destructive.

DO NOT replace an existing working schema without justification.

DO NOT create duplicate models for concepts that already exist.

---

# 3. DATABASE TECHNOLOGY

Use:

- MySQL 8.4+
- InnoDB
- utf8mb4
- appropriate utf8mb4 collation
- foreign key constraints
- primary keys
- unique constraints
- appropriate indexes
- CHECK constraints where genuinely useful and supported by the target version

MySQL foreign keys must be used to preserve referential integrity between related entities.

Use explicit and meaningful constraint names where appropriate.

---

# 4. ORM

If the existing project already uses Prisma:

KEEP PRISMA.

Do not introduce another ORM.

Use Prisma as the application-level database abstraction layer while MySQL remains the actual database engine.

The database design must be valid both:

- conceptually as relational MySQL
- practically through the project's Prisma schema

Do not allow Prisma convenience to produce a poor relational design.

---

# 5. DATABASE DESIGN PRINCIPLES

Follow these principles:

- Keep the schema small.
- Normalize where normalization provides real value.
- Avoid unnecessary normalization.
- Avoid duplicate data.
- Avoid unnecessary tables.
- Avoid unnecessary JSON fields.
- Avoid unnecessary polymorphism.
- Avoid premature abstraction.
- Avoid enterprise architecture.
- Avoid data warehouses.
- Avoid event-streaming infrastructure.
- Avoid separate tables for every small dimension.
- Avoid storing derived metrics when they can be calculated efficiently.
- Use aggregation tables only where they materially improve dashboard performance.

Every table must have a clear purpose.

If a proposed table cannot be justified by a concrete application requirement, do not create it.

---

# 6. REQUIRED DOMAIN MODEL

The final schema should support the following conceptual domains.

Do NOT assume these exact table names.

Choose professional names based on the existing codebase.

## Visitor

Represents an anonymous website visitor.

Potential information:

- id
- anonymous identifier
- first seen
- last seen
- visit count
- basic non-invasive technical information

Do not store invasive fingerprints.

Do not store unnecessary PII.

---

# 7. SESSION

Represents a browsing session.

Potential information:

- id
- visitor reference
- startedAt
- lastActivityAt
- endedAt where appropriate
- landing page
- exit page where useful
- traffic source
- referrer
- device information
- browser information
- OS information
- country information only if legally and technically appropriate

Define the session lifecycle clearly.

Do not create multiple conflicting session concepts.

---

# 8. ANALYTICS EVENTS

Create an event model only if the repository requires event-level analytics.

Potential events:

- PAGE_VIEW
- PROJECT_VIEW
- CONTACT_VIEW
- CONTACT_START
- CONTACT_SUBMIT
- CONTACT_SUCCESS
- CONTACT_ERROR
- OUTBOUND_CLICK
- FORM_ERROR
- SECURITY_EVENT where appropriate

Every event must have:

- unique identifier
- timestamp
- event type
- optional visitor reference
- optional session reference
- path/page
- optional project reference
- minimal metadata

Avoid storing arbitrary unlimited client payloads.

Do not use analytics events as a replacement for transactional business data.

For example:

A Contact Request is a real domain entity.

It must NOT exist only as an analytics event.

---

# 9. CONTACT / LEAD

The Contact entity is a core business entity.

It must survive analytics or email failures.

Potential fields:

- id
- name
- email
- phone if the existing form actually collects it
- subject
- message
- status
- source
- project association
- spam/risk information
- createdAt
- updatedAt
- repliedAt where required
- archivedAt / deletedAt only if justified

Do not create fields that the existing ContactForm does not need.

Inspect the existing form before deciding the final columns.

---

# 10. CONTACT STATUS

Use a controlled status model.

Possible values:

- NEW
- REVIEWING
- REPLIED
- ARCHIVED
- SPAM

Only implement statuses actually needed by the UI and workflow.

Do not over-model workflow states.

---

# 11. CONTACT TIMELINE

If the dashboard requires lead/contact history, implement a lightweight timeline model.

Possible events:

- CREATED
- STATUS_CHANGED
- REPLIED
- MARKED_SPAM
- PROJECT_ATTRIBUTED
- NOTE_ADDED

Do not build a full CRM activity system.

The timeline must remain lightweight.

---

# 12. PROJECT RELATIONSHIP

The analytics system must support:

Visitor
→ Project View
→ Contact

Example:

Home
→ Projects
→ Ativar
→ Contact
→ Successful Submission

The system must be able to answer:

- How many visitors viewed a project?
- Which projects are most popular?
- Which projects generated contacts?
- Which project had the highest conversion?
- Which project was associated with a contact?

Do not implement multi-touch attribution.

Use a simple, deterministic attribution rule.

---

# 13. TRAFFIC SOURCE

Support useful attribution information such as:

- direct
- organic
- referral
- social
- campaign / UTM

Potential fields:

- source
- medium
- campaign
- referrer

Do not create five separate relational tables for simple traffic dimensions unless query patterns justify them.

---

# 14. DEVICE / BROWSER / OS

Store useful technical dimensions without overengineering.

Potential dimensions:

- device type
- browser
- browser version if useful
- operating system
- OS version if useful
- screen size where appropriate

Do not create separate tables for every browser/device/OS.

Use compact dimensions or enums/reference values where appropriate.

---

# 15. DAILY METRICS

A daily aggregation model may be used for dashboard performance.

Potential metrics:

- visitors
- sessions
- page views
- project views
- contact views
- contact starts
- successful contacts
- conversion rate
- new visitors
- returning visitors

Do not store every possible metric.

Only persist metrics that materially improve dashboard performance or historical reporting.

Document how the aggregation is generated.

Aggregations must be safely re-runnable.

---

# 16. SECURITY EVENTS

Create a lightweight SecurityEvent model if required by the Master Prompt.

Potential event types:

- LOGIN_FAILURE
- RATE_LIMITED
- SPAM_BLOCKED
- DUPLICATE_SUBMISSION
- SUSPICIOUS_REQUEST
- ADMIN_SECURITY_ACTION

Potential fields:

- id
- event type
- severity
- timestamp
- source/IP representation where appropriate
- user/actor reference where appropriate
- metadata
- resolvedAt where needed

Do not store sensitive payloads unnecessarily.

Do not build a SIEM.

---

# 17. SPAM / RISK DATA

The Contact entity may store the result of deterministic anti-spam analysis.

Possible fields:

- spamScore
- spamStatus
- blockedReason
- honeypotTriggered
- timingFlag
- duplicateFlag

Avoid storing every internal calculation if it provides no operational value.

The database should retain enough information to explain why a submission was blocked or flagged.

---

# 18. SOFT DELETE

Use soft deletion only where it has a concrete business/security reason.

Do not add `deletedAt` to every table automatically.

For each candidate table, explicitly decide:

- hard delete
- soft delete
- immutable retention

Analytics events may need retention rather than conventional soft deletion.

Contacts may require archival rather than deletion depending on the application's requirements.

Document the decision.

---

# 19. AUDIT FIELDS

Use appropriate timestamps.

Most mutable domain entities should have:

- createdAt
- updatedAt

Do not add unnecessary audit columns to every table.

For security-sensitive entities, consider:

- createdAt
- resolvedAt
- actor/admin reference

only where useful.

---

# 20. PRIMARY KEYS

Use a consistent primary-key strategy.

Evaluate the existing project's conventions first.

Do not mix:

- UUID
- integer
- string IDs

without a clear reason.

If the project already uses UUIDs, preserve that convention.

If numeric IDs are already established and sufficient, do not migrate solely for theoretical reasons.

---

# 21. FOREIGN KEYS

Use explicit foreign key constraints for real relationships.

Examples:

Visitor
→ Session

Visitor
→ AnalyticsEvent

Session
→ AnalyticsEvent

Project
→ AnalyticsEvent

Project
→ Contact

Contact
→ ContactTimeline

User/Admin
→ SecurityEvent

Choose `ON DELETE` behavior deliberately.

Do NOT blindly use `CASCADE`.

For important business records, prefer preserving data rather than accidentally cascading deletion.

MySQL supports `RESTRICT`, `CASCADE`, `SET NULL`, and `NO ACTION`; select the behavior according to the actual lifecycle of each relationship.

---

# 22. INDEX STRATEGY

Indexes must be based on actual query patterns.

At minimum evaluate indexes for:

- timestamps
- visitor/session relationships
- event type + timestamp
- project + timestamp
- contact status
- contact createdAt
- traffic source
- security event timestamp
- foreign keys
- unique identifiers

Do not create indexes on every column.

Avoid redundant indexes.

For composite indexes, consider actual WHERE / ORDER BY patterns.

MySQL requires indexes for foreign-key relationships and uses them to enforce referential integrity efficiently.

---

# 23. UNIQUE CONSTRAINTS

Use unique constraints where business identity requires them.

Examples may include:

- visitor anonymous identifier
- session identifier
- externally generated event identifier
- other genuinely unique values

Do not use UNIQUE constraints merely because a value "looks unique."

---

# 24. NULLABILITY

Every nullable field must have a reason.

Do not use NULL as a substitute for unknown architecture.

For each field determine:

- required
- optional
- derived
- nullable

Avoid meaningless defaults.

---

# 25. ENUMS

Use controlled values for small, stable domains such as:

- contact status
- security severity
- event type
- spam status
- device type

Do not use enums for values expected to change frequently or be user-configurable.

Follow the existing project's Prisma conventions.

---

# 26. JSON

JSON may be used for genuinely flexible metadata such as limited analytics/security metadata.

However:

DO NOT use JSON as an excuse to avoid relational design.

Important queryable fields must remain normal columns.

Do not put:

- timestamps
- foreign keys
- statuses
- project IDs
- visitor IDs

inside JSON when they are core query dimensions.

---

# 27. PRIVACY

The database must follow data minimization.

Do not store:

- passwords in analytics
- authentication secrets
- JWT secrets
- API keys
- unnecessary message duplication
- keystrokes
- mouse movements
- session replay
- invasive fingerprints

If IP-related information is required for security/rate limiting, use the minimum retention and representation necessary for the actual feature.

---

# 28. RETENTION

Define reasonable retention strategy for high-volume analytics data.

Do not assume infinite event retention.

Potentially:

- keep aggregated daily metrics longer
- keep raw events for a shorter period
- retain contact records according to application requirements
- retain security events for a useful operational period

Do not implement automated deletion unless the requirement and environment are clear.

Document the intended policy.

---

# 29. TRANSACTIONS

Use transactions for operations where multiple writes must remain consistent.

Examples:

Contact persistence + associated domain records.

Analytics aggregation updates where atomicity matters.

Security events associated with sensitive operations.

Do not wrap every database query in a transaction.

---

# 30. CONCURRENCY

Consider:

- duplicate contact submissions
- duplicate analytics events
- simultaneous admin updates
- aggregation races
- retry behavior

Use database constraints and idempotency where appropriate.

Do not rely exclusively on application-level checks for uniqueness.

---

# 31. MIGRATION STRATEGY

If an existing database exists:

DO NOT drop and recreate it.

Create safe migrations.

Before migration:

1. inspect current schema
2. identify dependent code
3. identify data compatibility
4. determine nullable/default requirements
5. determine migration order
6. assess rollback risk

If destructive migration is unavoidable:

STOP and clearly report the destructive operation before performing it.

Never silently destroy production data.

---

# 32. SEED DATA

Only seed data that is genuinely required.

Do not generate fake analytics data unless explicitly requested.

If admin/user bootstrap is required, follow the existing authentication architecture.

Never hardcode real secrets in seed files.

---

# 33. PERFORMANCE REQUIREMENTS

The schema must support:

- dashboard date-range queries
- visitor/session counts
- page-view aggregation
- project analytics
- contact filtering
- contact status filtering
- security-event filtering
- daily growth comparison

Avoid designs that require loading millions of raw events into application memory.

Use database aggregation.

Use pagination.

Use indexes.

Do not build a data warehouse.

---

# 34. FAILURE ISOLATION

The database architecture must support:

Analytics failure
→ Portfolio continues working

Email failure
→ Contact remains stored

Dashboard query failure
→ Public website continues working

Security-event failure
→ Critical user action should not unnecessarily fail unless security requirements explicitly require fail-closed behavior

Design service boundaries accordingly.

---

# 35. REQUIRED DELIVERABLES

After the design phase, produce:

## A. Database Architecture

Explain:

- tables
- relationships
- important fields
- indexes
- constraints
- retention strategy
- privacy decisions

## B. ERD Description

Provide a clear textual relationship map.

Example:

Visitor
→ Session
→ AnalyticsEvent

Project
→ AnalyticsEvent

Project
→ Contact

Contact
→ ContactTimeline

Admin/User
→ SecurityEvent

## C. Prisma Schema

If Prisma is used by the repository, update the Prisma schema.

## D. MySQL Migration

Create the appropriate migration through the project's existing migration system.

The resulting SQL must be valid MySQL.

## E. Seed

Only if required.

## F. Database Utility Layer

Implement only the services/repositories actually needed by the application.

Do not create unnecessary abstraction layers.

## G. Documentation

Document:

- entity purpose
- metric relationships
- attribution rule
- retention assumptions
- indexes
- migration notes

---

# 36. VALIDATION

After implementation:

Run the project's available:

- Prisma validation
- typecheck
- lint
- tests
- migration validation
- build

Also verify the database itself.

Check:

- foreign keys
- indexes
- unique constraints
- nullability
- relations
- migration correctness
- query behavior

Use `SHOW CREATE TABLE` and appropriate MySQL metadata queries where useful.

---

# 37. DATABASE QUALITY CHECK

Before declaring the database complete, answer:

1. Does every table have a concrete purpose?
2. Are there duplicate concepts?
3. Are relationships enforced?
4. Are important queries indexed?
5. Are indexes non-redundant?
6. Are business records protected from accidental cascade deletion?
7. Is sensitive data minimized?
8. Can analytics grow without breaking the portfolio?
9. Can dashboard queries remain performant?
10. Can contact requests survive email failures?
11. Can analytics failures be isolated?
12. Are metric definitions reproducible?
13. Is the schema understandable to another developer?
14. Is the database more complex than the actual project requires?

If the answer to #14 is YES, simplify the schema.

---

# 38. FINAL OUTPUT FORMAT

At the end provide:

## Database Summary

Short explanation of the final architecture.

## Tables

List every final table and its purpose.

## Relationships

List important foreign-key relationships.

## Indexes

List important indexes and why they exist.

## Migrations

List migration files created/changed.

## Prisma

List Prisma schema changes if applicable.

## Security

List database-level security/privacy decisions.

## Validation

List commands actually executed and their real results.

## Risks / Follow-ups

List only real remaining issues.

DO NOT claim something was validated if you did not actually validate it.

---

# 39. NON-NEGOTIABLE RULES

DO NOT:

- create a data warehouse
- create microservices
- introduce Kafka
- introduce Elasticsearch
- introduce Redis solely for analytics
- introduce WebSockets solely for analytics
- build a CRM
- build multi-tenancy
- build enterprise RBAC
- build AI infrastructure
- build session replay
- build heatmaps
- build invasive fingerprinting
- create dozens of unnecessary tables
- duplicate existing models
- replace Prisma if it already exists
- destroy existing data
- add dependencies without justification

DO:

- inspect first
- design second
- implement third
- validate last
- reuse existing infrastructure
- keep MySQL relational and normalized where appropriate
- use foreign keys
- use meaningful indexes
- protect private data
- keep analytics lightweight
- preserve the public website
- optimize for correctness and maintainability

---

# 40. FINAL PRINCIPLE

The database is infrastructure, not the product.

Build the smallest database that can reliably support the Personal Intelligence Dashboard today while leaving clean extension points for tomorrow.

Correctness > feature count.

Data integrity > abstraction.

Privacy > unnecessary collection.

Useful analytics > analytics volume.

Simplicity > enterprise complexity.

Before creating any table, ask:

"Does this table solve a real requirement in this project?"

If the answer is no, do not create it.
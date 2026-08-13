-- =====================================================================
-- GHANBARIOMID.IR — Personal Intelligence Dashboard
-- Migration 0001_initial: initial schema (MySQL 8.4+, InnoDB, utf8mb4)
--
-- Prerequisite: the database referenced by DATABASE_URL must already
-- exist, e.g.:
--   CREATE DATABASE omid_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--
-- Charset/collation intended to be overridden per-table to utf8mb4 so
-- Persian text sorts consistently.
-- =====================================================================

-- ---------------------------------------------------------------------
-- visitor — anonymous website visitor (data minimisation: no PII,
-- no fingerprints). Matches src/types/analytics.ts VisitorRecord.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `visitor` (
  `id` CHAR(36) NOT NULL,                          -- anonymous visitorId (UUID)
  `first_seen_at` DATETIME(3) NOT NULL,
  `last_seen_at` DATETIME(3) NOT NULL,
  `device_type` VARCHAR(16) NOT NULL DEFAULT 'desktop',
  `browser` VARCHAR(64) NOT NULL DEFAULT 'Other',
  `os` VARCHAR(64) NOT NULL DEFAULT 'Other',
  `language` VARCHAR(16) NULL,
  `session_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_visitor_last_seen` (`last_seen_at`),
  CONSTRAINT `chk_visitor_device` CHECK (`device_type` IN ('desktop', 'mobile', 'tablet'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- session — one browsing session. `session` is not a reserved word in
-- MySQL but is backticked everywhere for safety.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `session` (
  `id` CHAR(36) NOT NULL,                          -- sessionId (UUID)
  `visitor_id` CHAR(36) NOT NULL,
  `started_at` DATETIME(3) NOT NULL,
  `last_activity_at` DATETIME(3) NOT NULL,
  `ended_at` DATETIME(3) NULL,
  `landing_page` VARCHAR(2048) NOT NULL DEFAULT '/',
  `exit_page` VARCHAR(2048) NULL,
  `page_views` INT UNSIGNED NOT NULL DEFAULT 0,
  `duration_ms` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `referrer` VARCHAR(2048) NULL,
  `source` VARCHAR(16) NOT NULL DEFAULT 'direct',
  `device_type` VARCHAR(16) NOT NULL DEFAULT 'desktop',
  `browser` VARCHAR(64) NOT NULL DEFAULT 'Other',
  `os` VARCHAR(64) NOT NULL DEFAULT 'Other',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_session_visitor` FOREIGN KEY (`visitor_id`) REFERENCES `visitor` (`id`) ON DELETE CASCADE,
  INDEX `idx_session_visitor` (`visitor_id`),
  INDEX `idx_session_started_at` (`started_at`),
  INDEX `idx_session_last_activity` (`last_activity_at`),
  CONSTRAINT `chk_session_source` CHECK (`source` IN ('direct', 'search', 'social', 'referral', 'campaign', 'other')),
  CONSTRAINT `chk_session_device` CHECK (`device_type` IN ('desktop', 'mobile', 'tablet'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- analytics_event — raw, lightweight event log. Core queryable
-- dimensions are columns, never JSON. Source/device/browser/os are
-- denormalised at ingest so daily aggregation needs no UA re-parsing.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `analytics_event` (
  `event_id` CHAR(36) NOT NULL,                    -- dedupe key (UUID)
  `event_name` VARCHAR(32) NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL,              -- server-normalised timestamp
  `session_id` CHAR(36) NULL,                      -- server-generated when absent
  `visitor_id` CHAR(36) NULL,                      -- server-generated when absent
  `path` VARCHAR(2048) NOT NULL DEFAULT '/',
  `project_slug` VARCHAR(64) NULL,
  `error_type` VARCHAR(32) NULL,
  `referrer` VARCHAR(2048) NULL,
  `utm_source` VARCHAR(512) NULL,
  `utm_medium` VARCHAR(512) NULL,
  `utm_campaign` VARCHAR(512) NULL,
  `utm_term` VARCHAR(512) NULL,
  `utm_content` VARCHAR(512) NULL,
  `screen_width` INT UNSIGNED NULL,
  `language` VARCHAR(16) NULL,
  `timezone` VARCHAR(64) NULL,
  `form_time_ms` INT UNSIGNED NULL,
  `page_time_ms` INT UNSIGNED NULL,
  `source` VARCHAR(16) NOT NULL DEFAULT 'direct',
  `device_type` VARCHAR(16) NOT NULL DEFAULT 'desktop',
  `browser` VARCHAR(64) NOT NULL DEFAULT 'Other',
  `os` VARCHAR(64) NOT NULL DEFAULT 'Other',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`event_id`),
  CONSTRAINT `fk_event_session` FOREIGN KEY (`session_id`) REFERENCES `session` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_visitor` FOREIGN KEY (`visitor_id`) REFERENCES `visitor` (`id`) ON DELETE CASCADE,
  INDEX `idx_event_occurred_at` (`occurred_at`),
  INDEX `idx_event_name_at` (`event_name`, `occurred_at`),
  INDEX `idx_event_visitor` (`visitor_id`),
  INDEX `idx_event_session` (`session_id`),
  INDEX `idx_event_project` (`project_slug`),
  CONSTRAINT `chk_event_name` CHECK (`event_name` IN (
    'PAGE_VIEW', 'SESSION_START', 'PROJECT_VIEW', 'CONTACT_FORM_VIEW',
    'CONTACT_FORM_START', 'CONTACT_FORM_SUBMIT', 'CONTACT_FORM_SUCCESS',
    'CONTACT_FORM_ERROR', 'OUTBOUND_CLICK'
  )),
  CONSTRAINT `chk_event_source` CHECK (`source` IN ('direct', 'search', 'social', 'referral', 'campaign', 'other')),
  CONSTRAINT `chk_event_device` CHECK (`device_type` IN ('desktop', 'mobile', 'tablet'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- contact — core business entity (a real lead, never just an event).
-- Survives email/analytics failures. json columns are lightweight
-- metadata only: timeline (ContactTimelineEvent[]) and spam_flags.
-- No deletedAt: an admin archives via status (§18).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact` (
  `id` CHAR(36) NOT NULL,                          -- UUID
  `name` VARCHAR(60) NOT NULL,
  `email` VARCHAR(120) NOT NULL,                   -- normalised lowercase at ingest
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,                         -- up to 2000 chars enforced by Zod
  `status` VARCHAR(16) NOT NULL DEFAULT 'NEW',
  `processing` VARCHAR(24) NOT NULL DEFAULT 'RECEIVED',
  `source` VARCHAR(16) NOT NULL DEFAULT 'direct',
  `referrer` VARCHAR(2048) NULL,
  `landing_page` VARCHAR(2048) NULL,
  `project_slug` VARCHAR(64) NULL,                 -- simple deterministic attribution
  `campaign` VARCHAR(512) NULL,
  `device_type` VARCHAR(16) NULL,
  `browser` VARCHAR(64) NULL,
  `os` VARCHAR(64) NULL,
  `language` VARCHAR(16) NULL,
  `spam_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `spam_flags` JSON NULL,                          -- string[] of match reasons
  `timeline` JSON NOT NULL,                        -- ContactTimelineEvent[] (lightweight)
  `duplicate_of` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_contact_duplicate_of` FOREIGN KEY (`duplicate_of`) REFERENCES `contact` (`id`) ON DELETE SET NULL,
  INDEX `idx_contact_created_at` (`created_at`),
  INDEX `idx_contact_status_created` (`status`, `created_at`),
  INDEX `idx_contact_project` (`project_slug`),
  INDEX `idx_contact_email` (`email`),
  CONSTRAINT `chk_contact_status` CHECK (`status` IN ('NEW', 'READ', 'REPLIED', 'ARCHIVED', 'SPAM')),
  CONSTRAINT `chk_contact_processing` CHECK (`processing` IN (
    'RECEIVED', 'VALIDATED', 'STORED', 'EMAIL_PENDING', 'EMAIL_SENT',
    'EMAIL_ERROR', 'FAILED', 'SPAM', 'BLOCKED'
  )),
  CONSTRAINT `chk_contact_device` CHECK (`device_type` IS NULL OR `device_type` IN ('desktop', 'mobile', 'tablet'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- contact_duplicate — atomic duplicate-claim table (idempotency key,
-- §30/§50). Replaces the Redis `ct:h:<sha>` key; rows are pruned past
-- the configured duplicate window.
--
-- NOTE: `contact_id` deliberately has NO foreign key to `contact`.
-- The claim is issued BEFORE the contact row exists (see contactService
-- persistContact), so enforcing a FK here would fail valid submissions.
-- Like the Redis contract it replaces, this is a transient idempotency
-- key whose value is a stored string reference only.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_duplicate` (
  `hash` VARCHAR(80) NOT NULL,                     -- "sha256:<64 hex>"
  `contact_id` CHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`hash`),
  INDEX `idx_dup_contact_id` (`contact_id`),
  INDEX `idx_dup_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- security_event — lightweight event log (§16). Never stores private
-- form content; meta is a small JSON with non-sensitive numbers/strings.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `security_event` (
  `id` CHAR(36) NOT NULL,                          -- UUID
  `type` VARCHAR(32) NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL,
  `ip` VARCHAR(64) NULL,
  `path` VARCHAR(2048) NULL,
  `reason` TEXT NULL,
  `meta` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_sec_occurred_at` (`occurred_at`),
  INDEX `idx_sec_type_at` (`type`, `occurred_at`),
  CONSTRAINT `chk_sec_type` CHECK (`type` IN (
    'SPAM_DETECTED', 'RATE_LIMIT_TRIGGERED', 'INVALID_PAYLOAD',
    'SUSPICIOUS_REQUEST', 'BLOCKED_REQUEST', 'AUTH_FAILURE'
  ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
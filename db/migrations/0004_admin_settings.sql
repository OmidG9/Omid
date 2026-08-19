-- =====================================================================
-- GHANBARIOMID.IR — Personal Intelligence Dashboard
-- Migration 0004: admin settings persistence + retention support
--
-- 1. `admin_setting` — single-row-per-key JSON store used by
--    src/lib/settings.ts when MySQL is the primary backend, so admin
--    thresholds (rate limit, spam, retention) survive restarts instead of
--    living only in Redis / process memory.
-- 2. Retention: the analytics tables already carry the indexes needed by
--    scripts/retention.js (idx_event_occurred_at, idx_session_started_at,
--    idx_session_last_activity, idx_visitor_last_seen, idx_sec_occurred_at)
--    and analytics_event/session cascade on visitor deletion, so pruning
--    old visitors + sessions automatically removes their raw events.
-- =====================================================================

CREATE TABLE IF NOT EXISTS `admin_setting` (
  `k` VARCHAR(64) NOT NULL,
  `v` JSON NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
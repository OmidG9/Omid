-- =====================================================================
-- GHANBARIOMID.IR — Personal Intelligence Dashboard
-- Migration 0002_contact_source_check
--
-- Additive: enforces that a contact's traffic source is one of the known
-- values (src/types/analytics.ts TrafficSource). Safe to apply on an
-- existing database.
-- =====================================================================

ALTER TABLE `contact`
  ADD CONSTRAINT `chk_contact_source`
    CHECK (`source` IN ('direct', 'search', 'social', 'referral', 'campaign', 'other'));
-- =====================================================================
-- GHANBARIOMID.IR — Personal Intelligence Dashboard
-- Migration 0003_drop_contact_duplicate_fk
--
-- Idempotent/conditional: drops the FK `fk_dup_contact` from
-- `contact_duplicate` ONLY if it still exists.
--
-- Why: 0001_initial.sql no longer creates that FK (the claim is issued
-- BEFORE the contact row exists, so a FK would reject valid submissions).
-- A database that was migrated AFTER that edit has no FK at all; a
-- database that was migrated BEFORE it still carries the constraint.
-- This conditional drop converges both to the same final schema.
-- =====================================================================

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'contact_duplicate'
    AND CONSTRAINT_NAME = 'fk_dup_contact'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @ddl := IF(@fk_exists > 0,
  'ALTER TABLE `contact_duplicate` DROP FOREIGN KEY `fk_dup_contact`',
  'SELECT 1');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
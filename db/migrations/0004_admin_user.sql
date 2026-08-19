-- =====================================================================
-- GHANBARIOMID.IR — Personal Intelligence Dashboard
-- Migration 0004_admin_user: database-backed admin credentials.
--
-- Replaces the old ADMIN_PASSWORD env-var login with a username + scrypt
-- password-hash row. The password is never stored in plain text; only a
-- salted scrypt KDF output (see src/lib/auth/adminCredentials.ts and
-- scripts/create-admin.js, which produce the same format).
--
-- Bootstrap the first admin with:
--   npm run admin:create
-- =====================================================================

CREATE TABLE IF NOT EXISTS `admin_user` (
  `id` CHAR(36) NOT NULL,                          -- UUID
  `username` VARCHAR(64) NOT NULL,                  -- lowercased, unique
  `password_hash` VARCHAR(512) NOT NULL,            -- scrypt$N$r$p$keylen$salt$hash
  `role` VARCHAR(32) NOT NULL DEFAULT 'admin',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `failed_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` DATETIME(3) NULL,
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_user_username` (`username`),
  CONSTRAINT `chk_admin_username_len` CHECK (CHAR_LENGTH(`username`) BETWEEN 3 AND 64),
  CONSTRAINT `chk_admin_role` CHECK (`role` IN ('admin', 'owner'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
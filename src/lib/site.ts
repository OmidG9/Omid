/**
 * Single source of truth for the public site URL.
 *
 * Canonical domain is configured via `SITE_URL` (no trailing slash). The
 * default matches the project's official domain so metadata/canonical/sitemap
 * stay consistent even before env vars are set. Every place that previously
 * hard-coded a base URL (layout metadata, sitemap, robots, project pages,
 * next.config allowedDevOrigins) should read from here.
 */

export function getSiteUrl(): string {
  const fromEnv = process.env.SITE_URL;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, '');
  }
  return 'https://ghanbariomid.ir';
}

/** Hostname (no protocol) for places that need it, e.g. allowedDevOrigins. */
export function getSiteHost(): string {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return 'ghanbariomid.ir';
  }
}
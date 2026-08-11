/**
 * فارسی (Persian) formatting helpers for the dashboard UI.
 * All functions return strings rendered with Persian digits (۰-۹).
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Convert Latin digits (0–9) in a string/number to Persian digits. */
export function toFaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * Format a number with Persian digits and thousands grouping.
 * Falls back to '—' for non-finite values.
 */
export function formatNumber(value: number, maxFractionDigits = 1): string {
  if (!Number.isFinite(value)) return '—';
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
  return toFaDigits(formatted);
}

/** Format a 0–100 ratio as a Persian percentage string, e.g. ۴۵٫۵٪. */
export function formatPercent(value: number, maxFractionDigits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${formatNumber(value, maxFractionDigits)}٪`;
}

/**
 * Convert a UTC day key "YYYY-MM-DD" into a Persian-calendar date key
 * "YYYY-MM-DD" (dash-separated, Persian digits). The dash separator keeps
 * callers like `.slice(5)` working to extract the month-day portion.
 */
export function formatDateKey(key: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});

  return `${toFaDigits(parts.year)}-${toFaDigits(parts.month)}-${toFaDigits(parts.day)}`;
}

/** Persian labels for traffic-source keys (see types/analytics.ts). */
export const SOURCE_LABELS: Record<string, string> = {
  direct: 'مستقیم',
  search: 'موتور جستجو',
  social: 'شبکه‌های اجتماعی',
  referral: 'ارجاعی',
  campaign: 'کمپین',
  other: 'سایر',
};

/** Persian labels for device-type keys (see types/analytics.ts). */
export const DEVICE_LABELS: Record<string, string> = {
  desktop: 'دسکتاپ',
  mobile: 'موبایل',
  tablet: 'تبلت',
};

/** Persian labels for security-event types (see lib/services/security.ts). */
export const SECURITY_TYPE_LABELS: Record<string, string> = {
  SPAM_DETECTED: 'هرزنامه شناسایی‌شده',
  RATE_LIMIT_TRIGGERED: 'محدودیت نرخ',
  INVALID_PAYLOAD: 'بار مؤثر نامعتبر',
  SUSPICIOUS_REQUEST: 'درخواست مشکوک',
  BLOCKED_REQUEST: 'درخواست مسدودشده',
  AUTH_FAILURE: 'شکست احراز هویت',
};

/** Persian labels for contact states (see types/contacts.ts). */
export const CONTACT_STATUS_LABELS: Record<string, string> = {
  NEW: 'جدید',
  READ: 'خوانده‌شده',
  REPLIED: 'پاسخ‌داده‌شده',
  ARCHIVED: 'بایگانی',
  SPAM: 'هرزنامه',
};

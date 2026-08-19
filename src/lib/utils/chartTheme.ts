/**
 * Shared chart color palette + per-category maps used across the admin dashboard.
 * Keeps chart colors consistent between pages and components.
 */

export const CHART_COLORS = {
  blue: '#3b82f6',
  cyan: '#22d3ee',
  purple: '#a78bfa',
  amber: '#f59e0b',
  emerald: '#34d399',
  red: '#ef4444',
  orange: '#f97316',
  violet: '#8b5cf6',
  rose: '#fb7185',
  teal: '#2dd4bf',
  slate: '#64748b',
  darkSlate: '#475569',
} as const;

/** Traffic-source colors (keys match types/analytics.ts source keys). */
export const SOURCE_COLORS: Record<string, string> = {
  direct: CHART_COLORS.blue,
  search: CHART_COLORS.cyan,
  social: CHART_COLORS.purple,
  referral: CHART_COLORS.amber,
  campaign: CHART_COLORS.emerald,
  other: CHART_COLORS.slate,
};

/** Device-type colors (keys match types/analytics.ts device keys). */
export const DEVICE_COLORS: Record<string, string> = {
  desktop: CHART_COLORS.blue,
  mobile: CHART_COLORS.cyan,
  tablet: CHART_COLORS.purple,
};

/** Security-event type colors (keys match lib/services/security.ts types). */
export const SECURITY_COLORS: Record<string, string> = {
  SPAM_DETECTED: CHART_COLORS.red,
  RATE_LIMIT_TRIGGERED: CHART_COLORS.amber,
  INVALID_PAYLOAD: CHART_COLORS.violet,
  SUSPICIOUS_REQUEST: CHART_COLORS.orange,
  BLOCKED_REQUEST: CHART_COLORS.red,
  AUTH_FAILURE: CHART_COLORS.blue,
};

export const FALLBACK_COLOR = CHART_COLORS.slate;

/** Convert a #rrggbb hex to rgba() with the given alpha (0–1). */
export function alpha(hex: string, a: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Horizontal bar gradient (RTL-aware: fill grows from the right). */
export function barGradient(color: string): string {
  return `linear-gradient(to left, ${color}, ${alpha(color, 0.45)})`;
}

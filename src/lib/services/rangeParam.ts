/**
 * Shared helpers for admin API routes: resolve date range from query params.
 */

import { resolveRange, type DateRange } from '@/lib/utils/date';

export function parseRange(
  mode: string | null | undefined,
  from?: string | null,
  to?: string | null
): DateRange {
  const m = mode && ['today', '7', '30', '90', 'custom'].includes(mode) ? mode : '30';
  return resolveRange(m, from ?? undefined, to ?? undefined);
}
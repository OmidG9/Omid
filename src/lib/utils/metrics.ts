/**
 * Shared metric calculations. Growth handling follows master prompt §21:
 * 0 → positive, positive → 0, negative trends, missing data. Never generate
 * misleading percentages.
 */

import { formatNumber } from '@/lib/utils/fa';

export interface PercentageChange {
  change: number | null; // percentage points, null when not meaningful
  direction: 'up' | 'down' | 'flat' | 'na';
  /** raw difference: current - previous */
  delta: number;
}

export function calculatePercentageChange(
  current: number,
  previous: number
): PercentageChange {
  const delta = current - previous;
  if (previous <= 0) {
    if (current <= 0) return { change: null, direction: 'flat', delta };
    // positive → 0 should read as growth from nothing, shown as "+100%"
    return { change: current > 0 ? null : 0, direction: 'na', delta };
  }
  const change = ((delta / previous) * 100) as number;
  if (Math.abs(change) < 0.05) return { change: 0, direction: 'flat', delta };
  return { change, direction: delta > 0 ? 'up' : 'down', delta };
}

export function formatChange(c: PercentageChange): string {
  if (c.direction === 'na' && c.delta > 0) return 'جدید';
  if (c.change === null) return '—';
  const sign = c.change > 0 ? '+' : '';
  return `${sign}${formatNumber(c.change)}٪`;
}

export function pct(value: number, total: number): number {
  if (total <= 0) return 0;
  return (value / total) * 100;
}

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return round1((numerator / denominator) * 100);
}

export function sumValues(map: Record<string, number> | undefined): number {
  if (!map) return 0;
  return Object.values(map).reduce((a, b) => a + b, 0);
}

export function topEntries(
  map: Record<string, number> | undefined,
  limit = 5
): Array<{ key: string; value: number }> {
  if (!map) return [];
  return Object.entries(map)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/**
 * Aggregate a daily traffic series into ISO-week buckets (§20). Returns one
 * point per week present in the input, ordered oldest → newest. Groups by the
 * week of each day so a 30/90-day view reads cleanly.
 */
export function aggregateWeekly<
  T extends { date: string; visitors: number; sessions: number; pageViews: number }
>(series: T[]): T[] {
  if (series.length === 0) return [];
  const buckets = new Map<string, T>();
  for (const point of series) {
    const [y, m, d] = point.date.split('-').map(Number);
    const key = isoWeekKey(y, m, d);
    const prev = buckets.get(key);
    if (!prev) {
      buckets.set(key, { ...point, date: key });
      continue;
    }
    prev.visitors += point.visitors;
    prev.sessions += point.sessions;
    prev.pageViews += point.pageViews;
  }
  return [...buckets.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function isoWeekKey(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstDay = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const weekNumber = Math.round(
    ((date.getTime() - firstDay.getTime()) / 86400000 - 3 + ((firstDay.getUTCDay() + 6) % 7)) / 7 + 1
  );
  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

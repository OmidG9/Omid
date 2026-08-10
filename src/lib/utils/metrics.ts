/**
 * Shared metric calculations. Growth handling follows master prompt §21:
 * 0 → positive, positive → 0, negative trends, missing data. Never generate
 * misleading percentages.
 */

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
  if (c.direction === 'na' && c.delta > 0) return 'new';
  if (c.change === null) return '—';
  const sign = c.change > 0 ? '+' : '';
  return `${sign}${c.change.toFixed(1)}%`;
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
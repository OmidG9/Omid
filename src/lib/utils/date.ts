/** Date helpers. All analytics dates are UTC day boundaries (YYYY-MM-DD). */

export const DAY_MS = 86_400_000;

/** Format an epoch ms as YYYY-MM-DD in UTC. */
export function dateKey(d: Date | number): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().slice(0, 10);
}

export function startOfDayUtc(ts: number): number {
  return Math.floor(ts / DAY_MS) * DAY_MS;
}

export function addDays(ts: number, days: number): number {
  return startOfDayUtc(ts) + days * DAY_MS;
}

/** [from, to] both inclusive day keys for the trailing N days ending at `end`. */
export function trailingRange(days: number, end = Date.now()): [string, string] {
  const to = dateKey(end);
  const from = dateKey(addDays(end, -(days - 1)));
  return [from, to];
}

/** Enumerate inclusive date keys between two dates (inclusive). */
export function rangeKeys(fromKey: string, toKey: string): string[] {
  const out: string[] = [];
  let cursor = new Date(`${fromKey}T00:00:00Z`).getTime();
  const end = new Date(`${toKey}T00:00:00Z`).getTime();
  let guard = 0;
  while (cursor <= end && guard < 5000) {
    out.push(dateKey(cursor));
    cursor += DAY_MS;
    guard += 1;
  }
  return out;
}

export interface DateRange {
  from: number; // inclusive, start of day UTC
  to: number; // inclusive, end of day UTC (23:59:59.999)
  fromKey: string;
  toKey: string;
  days: number; // previous-period length for comparison
}

export function resolveRange(mode: string, fromParam?: string, toParam?: string): DateRange {
  const now = Date.now();
  const today = startOfDayUtc(now);
  const to = today + DAY_MS - 1;

  switch (mode) {
    case 'today': {
      return { from: today, to, fromKey: dateKey(today), toKey: dateKey(today), days: 1 };
    }
    case '7':
      return { from: today - 6 * DAY_MS, to, fromKey: dateKey(today - 6 * DAY_MS), toKey: dateKey(today), days: 7 };
    case '30':
      return { from: today - 29 * DAY_MS, to, fromKey: dateKey(today - 29 * DAY_MS), toKey: dateKey(today), days: 30 };
    case '90':
      return { from: today - 89 * DAY_MS, to, fromKey: dateKey(today - 89 * DAY_MS), toKey: dateKey(today), days: 90 };
    case 'custom': {
      const fromKey = fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : dateKey(today - 29 * DAY_MS);
      const toKey = toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam) ? toParam : dateKey(today);
      const from = new Date(`${fromKey}T00:00:00Z`).getTime();
      const toEnd = new Date(`${toKey}T00:00:00Z`).getTime() + DAY_MS - 1;
      if (from > toEnd) return resolveRange('30');
      const days = Math.max(1, Math.round((toEnd - from) / DAY_MS) + 1);
      return { from, to: toEnd, fromKey, toKey, days };
    }
    default:
      return resolveRange('30');
  }
}

export const DATE_RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7', label: '7 Days' },
  { id: '30', label: '30 Days' },
  { id: '90', label: '90 Days' },
  { id: 'custom', label: 'Custom' },
] as const;
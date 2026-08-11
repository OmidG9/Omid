'use client';

import { useState } from 'react';
import AnalyticsChart from '@/components/admin/AnalyticsChart';
import { toFaDigits } from '@/lib/utils/fa';

interface SeriesPoint {
  date: string;
  visitors: number;
  sessions: number;
  pageViews: number;
}

type Metric = 'visitors' | 'sessions' | 'pageViews';
type Granularity = 'daily' | 'weekly';

const METRICS: Array<{ id: Metric; label: string; color: string }> = [
  { id: 'visitors', label: 'بازدیدکنندگان', color: '#3b82f6' },
  { id: 'sessions', label: 'نشست‌ها', color: '#22d3ee' },
  { id: 'pageViews', label: 'بازدید صفحات', color: '#475569' },
];

export default function TrafficChart({ series }: { series: SeriesPoint[] }) {
  const [metric, setMetric] = useState<Metric>('visitors');
  const [granularity, setGranularity] = useState<Granularity>('daily');

  const values = series.map((s) => s[metric]);
  const labels = series.map((s) => s.date);

  const active = METRICS.find((m) => m.id === metric)!;
  const showWeekly = series.length > 14;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              aria-pressed={metric === m.id}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                metric === m.id
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full me-1.5 align-middle" style={{ background: m.color }} />
              {m.label}
            </button>
          ))}
        </div>
        {showWeekly && (
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-600">دوره</span>
            {(['daily', 'weekly'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                aria-pressed={granularity === g}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors border ${
                  granularity === g
                    ? 'bg-slate-800 text-slate-200 border-slate-600/50'
                    : 'text-slate-500 hover:text-slate-300 border-transparent'
                }`}
              >
                {g === 'daily' ? 'روزانه' : 'هفتگی'}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnalyticsChart
        values={values}
        color={active.color}
        labels={labels.map((d) => toFaDigits(formatAxisLabel(d, granularity)))}
      />
      {granularity === 'weekly' && (
        <p className="mt-1 text-[10px] text-slate-600">
          مقادیر به تفکیک هفته جمع شده‌اند — نمایش برای بازه‌های ۳۰/۹۰ روزه.
        </p>
      )}
    </div>
  );
}

function formatAxisLabel(date: string, granularity: Granularity): string {
  if (granularity === 'weekly') {
    const [, week] = date.split('-W');
    return `هفته ${week}`;
  }
  // "YYYY-MM-DD" → "MM-DD" is what the old dashboard used; keep month-day.
  return date.length >= 10 ? date.slice(5) : date;
}
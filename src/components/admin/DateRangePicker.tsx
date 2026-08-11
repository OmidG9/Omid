'use client';

import { usePathname, useRouter } from 'next/navigation';
import { CalendarRange } from 'lucide-react';
import { DATE_RANGE_PRESETS } from '@/lib/utils/date';

export type RangeMode = 'today' | '7' | '30' | '90' | 'custom';

export default function DateRangePicker({
  mode,
  from,
  to,
}: {
  mode: RangeMode;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function apply(next: { mode: RangeMode; from?: string; to?: string }) {
    const params = new URLSearchParams();
    params.set('range', next.mode);
    if (next.mode === 'custom') {
      if (next.from) params.set('from', next.from);
      if (next.to) params.set('to', next.to);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <CalendarRange size={15} className="text-slate-500 ms-1" />
      {DATE_RANGE_PRESETS.map((p) => {
        const active = mode === p.id;
        return (
          <button
            key={p.id}
            onClick={() => apply({ mode: p.id, from, to })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              active
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
            }`}
          >
            {p.label}
          </button>
        );
      })}
      {mode === 'custom' && (
        <div className="flex items-center gap-1.5 ms-2">
          <input
            type="date"
            value={from ?? ''}
            onChange={(e) => apply({ mode: 'custom', from: e.target.value, to })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
            aria-label="تاریخ شروع"
          />
          <span className="text-slate-600 text-xs">تا</span>
          <input
            type="date"
            value={to ?? ''}
            onChange={(e) => apply({ mode: 'custom', from, to: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
            aria-label="تاریخ پایان"
          />
        </div>
      )}
    </div>
  );
}
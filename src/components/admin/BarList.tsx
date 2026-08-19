'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils/fa';
import { barGradient, alpha } from '@/lib/utils/chartTheme';
import { useReducedMotion } from './chartCore';

export interface BarEntry {
  key: string;
  value: number;
  color?: string;
}

export default function BarList({
  data,
  showPercent = true,
  emptyTitle = 'هنوز داده‌ای ثبت نشده',
  color = '#3b82f6',
}: {
  data: BarEntry[];
  showPercent?: boolean;
  emptyTitle?: string;
  color?: string;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-600">{emptyTitle}</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const barColor = d.color ?? color;
        const show = mounted || reduced;
        return (
          <li key={d.key} className="group">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate text-slate-300 group-hover:text-white" title={d.key}>
                {d.key}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-200">
                {formatNumber(d.value)}
              </span>
              {showPercent && (
                <span className="w-11 shrink-0 text-left tabular-nums text-slate-500">
                  {max > 1
                    ? `${new Intl.NumberFormat('fa-IR').format(Math.round(pct))}٪`
                    : '۱۰۰٪'}
                </span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
              <div
                className="h-full rounded-full"
                style={{
                  width: show ? `${Math.max(pct, d.value > 0 ? 2 : 0)}%` : '0%',
                  background: barGradient(barColor),
                  boxShadow: `0 0 12px ${alpha(barColor, 0.35)}`,
                  transition:
                    mounted && !reduced
                      ? `width 700ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 55}ms`
                      : undefined,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
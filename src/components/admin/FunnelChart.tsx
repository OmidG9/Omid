'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils/fa';
import { barGradient, alpha } from '@/lib/utils/chartTheme';
import { ArrowDown } from 'lucide-react';
import { useReducedMotion } from './chartCore';

export interface FunnelStep {
  label: string;
  value: number;
  color?: string;
}

export default function FunnelChart({
  steps,
  emptyLabel = 'هنوز داده‌ای ثبت نشده',
}: {
  steps: FunnelStep[];
  emptyLabel?: string;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const max = Math.max(1, ...steps.map((s) => s.value));

  if (steps.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-600">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        const c = s.color ?? '#3b82f6';
        const show = mounted || reduced;
        const retention =
          i > 0 && steps[i - 1].value > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : null;
        return (
          <div key={i}>
            {i > 0 && (
              <div className="mb-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <ArrowDown size={11} className="text-slate-600" />
                {retention != null && (
                  <span>
                    <b className="tabular-nums font-semibold text-slate-400">
                      {new Intl.NumberFormat('fa-IR').format(retention)}٪
                    </b>{' '}
                    نسبت به مرحلهٔ قبل
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] text-slate-400">{s.label}</span>
              <div className="min-w-0 flex-1">
                <div
                  className="relative mx-auto flex h-9 items-center justify-center overflow-hidden rounded-lg border border-slate-700/40"
                  style={{
                    width: show ? `${Math.max(pct, s.value > 0 ? 5 : 0)}%` : '0%',
                    transition:
                      mounted && !reduced
                        ? `width 700ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 90}ms`
                        : undefined,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: barGradient(c),
                      opacity: 0.9,
                    }}
                  />
                  <span
                    className="relative z-10 text-[11px] font-bold tabular-nums text-white drop-shadow"
                    style={{ textShadow: `0 1px 3px ${alpha('#000000', 0.6)}` }}
                  >
                    {formatNumber(s.value)}
                  </span>
                </div>
              </div>
              <span className="w-12 shrink-0 text-left text-[11px] tabular-nums text-slate-500">
                {`${new Intl.NumberFormat('fa-IR').format(Math.round(pct))}٪`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
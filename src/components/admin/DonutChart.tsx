'use client';

import { useEffect, useId, useState } from 'react';
import { formatNumber } from '@/lib/utils/fa';
import { useReducedMotion } from './chartCore';

export interface DonutSlice {
  key: string;
  value: number;
  color: string;
}

const R = 42;
const C = 2 * Math.PI * R;
const GAP = 1.5;

interface DonutChartProps {
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  emptyLabel?: string;
}

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 132,
  emptyLabel = 'هنوز داده‌ای ثبت نشده',
}: DonutChartProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const total = data.reduce((a, d) => a + d.value, 0);
  const thickness = Math.max(10, size / 9);

  let offset = 0;
  const segments = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0;
    const seg = { ...d, frac, dash: frac * C, offset: offset * C };
    offset += frac;
    return seg;
  });

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-xs text-slate-600">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`نمودار توزیع — ${data
            .map((s) => `${s.key}: ${formatNumber(s.value)}`)
            .join('، ')}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={R * (size / 120)}
            fill="none"
            stroke="#1e293b"
            strokeWidth={thickness}
          />
          {segments.map((s, i) => {
            const dimmed = hover != null && hover !== i;
            const show = mounted || reduced;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={R * (size / 120)}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === i ? thickness + 3 : thickness}
                strokeDasharray={`${Math.max(s.dash - GAP, 0)} ${C}`}
                strokeDashoffset={show ? -s.offset * C : C}
                strokeLinecap="butt"
                style={{
                  opacity: dimmed ? 0.35 : 1,
                  transition: show && !reduced
                    ? 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1), stroke-width 160ms ease, opacity 160ms ease'
                    : 'stroke-width 160ms ease, opacity 160ms ease',
                  cursor: 'pointer',
                }}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && (
            <p className="max-w-full truncate px-2 text-xl font-bold tabular-nums text-slate-100">
              {centerValue}
            </p>
          )}
          {centerLabel && <p className="text-[10px] text-slate-500">{centerLabel}</p>}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((s, i) => {
          const dimmed = hover != null && hover !== i;
          return (
            <li
              key={s.key}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              className="flex items-center gap-2 text-xs"
              style={{ opacity: dimmed ? 0.45 : 1, transition: 'opacity 160ms ease' }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
                style={{ background: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-slate-300">{s.key}</span>
              <span className="shrink-0 font-medium tabular-nums text-slate-200">
                {formatNumber(s.value)}
              </span>
              <span className="w-11 shrink-0 text-left tabular-nums text-slate-500">
                {`${new Intl.NumberFormat('fa-IR').format(Math.round(s.frac * 100))}٪`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
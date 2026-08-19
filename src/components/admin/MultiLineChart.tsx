'use client';

import { useId, useRef, useState, useEffect, useCallback } from 'react';
import { formatNumber } from '@/lib/utils/fa';
import { alpha } from '@/lib/utils/chartTheme';
import {
  CHART_W,
  CHART_H,
  PAD_X,
  PAD_TOP,
  PAD_BOTTOM,
  clamp,
  buildPoints,
  smoothD,
  useReducedMotion,
  type Pt,
} from './chartCore';

export interface MultiSeries {
  id: string;
  name: string;
  color: string;
  values: number[];
}

interface MultiLineChartProps {
  series: MultiSeries[];
  labels?: string[];
  tooltipLabels?: string[];
  height?: number;
  emptyLabel?: string;
}

export default function MultiLineChart({
  series,
  labels,
  tooltipLabels,
  height = 240,
  emptyLabel = 'هنوز داده‌ای برای نمایش ثبت نشده',
}: MultiLineChartProps) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<SVGPathElement | null>>([]);
  const reduced = useReducedMotion();

  const [active, setActive] = useState<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const [mounted, setMounted] = useState(false);
  const [lengths, setLengths] = useState<number[]>([]);

  const empty = series.every((s) => s.values.length === 0);
  const maxLen = Math.max(0, ...series.map((s) => s.values.length));

  const allValues = series.flatMap((s) => s.values);
  const min = Math.min(0, ...allValues);
  const max = Math.max(...allValues, 1);
  const chartValues = maxLen > 0 ? Array.from({ length: maxLen }, (_, i) => i) : [0];
  const pts = buildPoints(chartValues, min, max);

  const lines = series.map((s) => ({
    ...s,
    d: smoothD(buildPoints(s.values.length > 0 ? s.values : [0], min, max)),
  }));

  useEffect(() => {
    const newLengths = lineRefs.current.map((el) => (el ? el.getTotalLength() || 0 : 0));
    setLengths(newLengths);
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [series]);

  const drawActive = reduced || mounted;

  const indexFromClientX = useCallback(
    (clientX: number) => {
      const el = wrapRef.current;
      if (!el || maxLen === 0) return null;
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * CHART_W;
      const step = maxLen > 1 ? (CHART_W - PAD_X * 2) / (maxLen - 1) : 0;
      const idx = step > 0 ? Math.round((x - PAD_X) / step) : 0;
      return clamp(idx, 0, maxLen - 1);
    },
    [maxLen]
  );

  const moveTo = useCallback(
    (idx: number) => {
      const i = clamp(idx, 0, Math.max(0, maxLen - 1));
      setActive(i);
      const label = tooltipLabels?.[i] ?? labels?.[i] ?? '';
      const parts = series
        .map((s) => {
          const v = s.values[i];
          return v !== undefined ? `${s.name}: ${formatNumber(v)}` : '';
        })
        .filter(Boolean)
        .join('، ');
      setAnnounce(parts ? `${label} — ${parts}` : label);
    },
    [series, maxLen, labels, tooltipLabels]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const cur = active ?? maxLen - 1;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveTo(cur + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveTo(cur - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      moveTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      moveTo(maxLen - 1);
    }
  };

  const tickCount = labels && labels.length > 0 ? Math.min(labels.length, 8) : 0;
  const tickValues: Array<{ label: string; x: number }> = [];
  if (tickCount > 0 && labels) {
    for (let i = 0; i < tickCount; i++) {
      const idx = Math.round((i / (tickCount - 1 || 1)) * (labels.length - 1));
      const x = PAD_X + idx * ((CHART_W - PAD_X * 2) / (labels.length - 1 || 1));
      tickValues.push({ label: labels[idx], x });
    }
  }

  const activePt: Pt | undefined = active != null ? pts[active] : undefined;
  const tooltipLeft =
    activePt != null ? `${clamp((activePt.x / CHART_W) * 100, 16, 84)}%` : '0%';
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div>
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {series.map((s, i) => {
          const last = s.values[s.values.length - 1];
          return (
            <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span
                className="inline-block h-[3px] w-4 rounded-full"
                style={{
                  background: s.color,
                  ...(i === 1 ? { backgroundImage: `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 7px)` } : {}),
                }}
              />
              {s.name}
              {last !== undefined && (
                <b className="text-slate-200 tabular-nums font-medium">{formatNumber(last)}</b>
              )}
            </span>
          );
        })}
      </div>

      {empty ? (
        <div className="flex items-center justify-center h-40 text-xs text-slate-600">
          {emptyLabel}
        </div>
      ) : (
        <div
          ref={wrapRef}
          role="group"
          aria-label="نمودار چندمتغیره ترافیک"
          tabIndex={0}
          onPointerMove={(e) => {
            const i = indexFromClientX(e.clientX);
            if (i != null) setActive(i);
          }}
          onPointerDown={(e) => {
            const i = indexFromClientX(e.clientX);
            if (i != null) setActive(i);
          }}
          onPointerLeave={() => setActive(null)}
          onKeyDown={handleKeyDown}
          onFocus={() => setActive(maxLen - 1)}
          onBlur={() => {
            setActive(null);
            setAnnounce('');
          }}
          className="relative cursor-crosshair rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
        >
          <span className="sr-only" aria-live="polite">
            {announce}
          </span>

          <svg
            role="img"
            aria-label="نمودار خطی چند متغیره"
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            style={{ width: '100%', maxHeight: height }}
          >
            <defs>
              {series.map((s) => (
                <linearGradient key={s.id} id={`mlg-${s.id}-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {gridLines.map((f) => (
              <line
                key={f}
                x1={PAD_X}
                x2={CHART_W - PAD_X}
                y1={PAD_TOP + f * (CHART_H - PAD_TOP - PAD_BOTTOM)}
                y2={PAD_TOP + f * (CHART_H - PAD_TOP - PAD_BOTTOM)}
                stroke="#1e293b"
                strokeWidth={1}
                strokeDasharray="3 5"
              />
            ))}
            <line
              x1={PAD_X}
              x2={CHART_W - PAD_X}
              y1={CHART_H - PAD_BOTTOM}
              y2={CHART_H - PAD_BOTTOM}
              stroke="#334155"
              strokeWidth={1}
            />

            {series.map((s, si) => {
              const ptsI = buildPoints(s.values.length > 0 ? s.values : [0], min, max);
              const lineDI = smoothD(ptsI);
              const areaDI =
                ptsI.length > 0
                  ? `${lineDI} L ${ptsI[ptsI.length - 1].x} ${CHART_H - PAD_BOTTOM} L ${
                      ptsI[0].x
                    } ${CHART_H - PAD_BOTTOM} Z`
                  : '';
              const len = lengths[si] ?? 0;
              const dashed = si % 2 === 1;
              return (
                <g key={s.id}>
                  {areaDI && (
                    <path
                      d={areaDI}
                      fill={`url(#mlg-${s.id}-${id})`}
                      stroke="none"
                      style={{
                        opacity: drawActive ? 1 : 0,
                        transition:
                          drawActive && !reduced ? 'opacity 700ms ease 250ms' : undefined,
                      }}
                    />
                  )}
                  {lineDI && (
                    <path
                      ref={(el) => {
                        lineRefs.current[si] = el;
                      }}
                      d={lineDI}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      strokeDasharray={dashed ? '6 6' : undefined}
                      style={
                        reduced
                          ? undefined
                          : {
                              strokeDasharray: dashed ? undefined : len,
                              strokeDashoffset: mounted ? 0 : len,
                              transition: 'stroke-dashoffset 1000ms cubic-bezier(0.22, 1, 0.36, 1)',
                            }
                      }
                    />
                  )}
                </g>
              );
            })}

            {active != null && activePt && (
              <>
                <line
                  x1={activePt.x}
                  x2={activePt.x}
                  y1={PAD_TOP}
                  y2={CHART_H - PAD_BOTTOM}
                  stroke="#64748b"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                {series.map((s) => {
                  const v = s.values[active];
                  if (v === undefined) return null;
                  const p = buildPoints(s.values, min, max)[active];
                  return (
                    <circle
                      key={s.id}
                      cx={p.x}
                      cy={p.y}
                      r={4.5}
                      fill={s.color}
                      stroke="#020617"
                      strokeWidth={2}
                    />
                  );
                })}
              </>
            )}
          </svg>

          {active != null && activePt && (
            <div
              className="pointer-events-none absolute z-10 -top-1 -translate-x-1/2 -translate-y-full"
              style={{ left: tooltipLeft }}
            >
              <div className="whitespace-nowrap rounded-lg border border-slate-700/70 bg-slate-900/95 px-3 py-1.5 shadow-xl shadow-black/40 backdrop-blur">
                <p className="text-[10px] text-slate-400">
                  {tooltipLabels?.[active] ?? labels?.[active] ?? ''}
                </p>
                <ul className="mt-0.5 space-y-0.5">
                  {series.map((s) => {
                    const v = s.values[active];
                    if (v === undefined) return null;
                    return (
                      <li key={s.id} className="flex items-center gap-1.5 text-xs">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-slate-300">{s.name}</span>
                        <b className="tabular-nums font-bold text-slate-100">{formatNumber(v)}</b>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {tickValues.length > 0 && (
        <div className="relative mt-2 h-4 text-[10px] text-slate-500">
          {tickValues.map((t, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 tabular-nums"
              style={{ left: `${clamp((t.x / CHART_W) * 100, 3, 97)}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
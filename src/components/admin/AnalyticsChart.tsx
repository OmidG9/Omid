'use client';

import { useId, useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
  areaD,
  useReducedMotion,
  type Pt,
} from './chartCore';

interface AnalyticsChartProps {
  values: number[];
  /** Short x-axis labels shown below the chart (already Persian). */
  labels?: string[];
  /** Longer labels used inside the tooltip (e.g. full Persian dates). */
  tooltipLabels?: string[];
  height?: number;
  color?: string;
  showArea?: boolean;
  strokeWidth?: number;
  /** Show a compact summary row (total / average / peak). */
  showStats?: boolean;
  emptyLabel?: string;
  /** Short name used in aria-labels, e.g. "بازدیدکنندگان". */
  name?: string;
}

export default function AnalyticsChart({
  values,
  labels,
  tooltipLabels,
  height = 220,
  color = '#3b82f6',
  showArea = true,
  strokeWidth = 2.5,
  showStats = true,
  emptyLabel = 'هنوز داده‌ای برای نمایش ثبت نشده',
  name = 'نمودار',
}: AnalyticsChartProps) {
  const id = useId();
  const gid = `area-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();

  const [active, setActive] = useState<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const [mounted, setMounted] = useState(false);
  const [length, setLength] = useState(0);

  const empty = values.length === 0;
  const clean = useMemo(() => (empty ? [0] : values), [empty, values]);

  const min = Math.min(...clean, 0);
  const max = Math.max(...clean);
  const pts = buildPoints(clean, min, max);
  const lineD = smoothD(pts);
  const areaPath = showArea ? areaD(lineD, pts) : '';

  const total = clean.reduce((a, b) => a + b, 0);
  const avg = clean.length > 0 ? total / clean.length : 0;
  const peakIdx = clean.length > 0 ? clean.indexOf(Math.max(...clean)) : 0;

  useEffect(() => {
    const el = lineRef.current;
    if (el) setLength(el.getTotalLength() || 0);
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [lineD]);

  const drawActive = reduced || mounted;

  const indexFromClientX = useCallback(
    (clientX: number) => {
      const el = wrapRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * CHART_W;
      const step = clean.length > 1 ? (CHART_W - PAD_X * 2) / (clean.length - 1) : 0;
      const idx = step > 0 ? Math.round((x - PAD_X) / step) : 0;
      return clamp(idx, 0, clean.length - 1);
    },
    [clean.length]
  );

  const moveTo = useCallback(
    (idx: number) => {
      const i = clamp(idx, 0, clean.length - 1);
      setActive(i);
      const label = tooltipLabels?.[i] ?? labels?.[i] ?? '';
      setAnnounce(`${name}، ${label} — ${formatNumber(clean[i])}`);
    },
    [clean, labels, tooltipLabels, name]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const cur = active ?? clean.length - 1;
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
      moveTo(clean.length - 1);
    }
  };

  // X-axis tick labels: subsample so the chart never has more than 8 labels.
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
    activePt != null ? `${clamp((activePt.x / CHART_W) * 100, 14, 86)}%` : '0%';
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div>
      {empty ? (
        <div className="flex items-center justify-center h-40 text-xs text-slate-600">
          {emptyLabel}
        </div>
      ) : (
        <div
          ref={wrapRef}
          role="group"
          aria-label={`${name} — جمع ${formatNumber(total)}، اوج ${formatNumber(max)}`}
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
          onFocus={() => setActive(clean.length - 1)}
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
            aria-label={`${name} — نمودار خطی`}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            style={{ width: '100%', maxHeight: height }}
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
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

            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#${gid})`}
                stroke="none"
                style={{
                  opacity: drawActive ? 1 : 0,
                  transition: drawActive && !reduced ? 'opacity 700ms ease 180ms' : undefined,
                }}
              />
            )}

            {lineD && (
              <path
                ref={lineRef}
                d={lineD}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={
                  reduced
                    ? undefined
                    : {
                        strokeDasharray: length,
                        strokeDashoffset: mounted ? 0 : length,
                        transition: 'stroke-dashoffset 1000ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }
                }
              />
            )}

            {activePt && (
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
                <circle
                  cx={activePt.x}
                  cy={activePt.y}
                  r={5.5}
                  fill={color}
                  stroke="#020617"
                  strokeWidth={2}
                  style={{ transition: 'cx 150ms ease, cy 150ms ease' }}
                />
                <circle
                  cx={activePt.x}
                  cy={activePt.y}
                  r={9}
                  fill="none"
                  stroke={alpha(color, 0.45)}
                  strokeWidth={2}
                  style={{ transition: 'cx 150ms ease, cy 150ms ease' }}
                />
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
                <p className="text-xs font-bold tabular-nums" style={{ color }}>
                  {formatNumber(clean[active])}
                </p>
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

      {showStats && !empty && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800/70 pt-3 text-[11px] text-slate-500">
          <span>
            جمع: <b className="text-slate-300 tabular-nums font-medium">{formatNumber(total)}</b>
          </span>
          <span>
            میانگین: <b className="text-slate-300 tabular-nums font-medium">{formatNumber(avg)}</b>
          </span>
          <span>
            اوج: <b className="text-slate-300 tabular-nums font-medium">{formatNumber(max)}</b>
            {labels?.[peakIdx] && (
              <span className="text-slate-600"> ({labels[peakIdx]})</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
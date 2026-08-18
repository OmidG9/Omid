'use client';

import { useId } from 'react';

const W = 600;
const H = 180;
const PAD_X = 4;
const PAD_TOP = 12;
const PAD_BOTTOM = 6;

function buildPath(values: number[], min: number, max: number): Array<[number, number]> {
  const step = values.length > 1 ? (W - PAD_X * 2) / (values.length - 1) : W - PAD_X * 2;
  const range = max - min || 1;
  return values.map((v, i) => {
    const x = PAD_X + i * step;
    const y = H - PAD_BOTTOM - ((v - min) / range) * (H - PAD_TOP - PAD_BOTTOM);
    return [x, y] as [number, number];
  });
}

function smoothD(pts: Array<[number, number]>): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

interface AnalyticsChartProps {
  values: number[];
  labels?: string[];
  height?: number;
  color?: string;
  showArea?: boolean;
  strokeWidth?: number;
  showZeroLine?: boolean;
}

export default function AnalyticsChart({
  values,
  labels,
  height = 200,
  color = '#3b82f6',
  showArea = true,
  strokeWidth = 2,
  showZeroLine = true,
}: AnalyticsChartProps) {
  const id = useId();
  const gid = `area-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const clean = values.length === 0 ? [0] : values;
  const min = Math.min(...clean, 0);
  const max = Math.max(...clean);
  const pts = buildPath(clean, min, max);
  const lineD = smoothD(pts);
  const areaD =
    pts.length > 0
      ? `${lineD} L ${pts[pts.length - 1][0]} ${H - PAD_BOTTOM} L ${pts[0][0]} ${H - PAD_BOTTOM} Z`
      : '';

  // X-axis tick labels: subsample so the chart never has more than ~10 labels.
  const tickCount = labels ? Math.min(labels.length, 10) : 0;
  const tickValues: Array<{ label: string; x: number }> = [];
  if (labels && labels.length > 0) {
    for (let i = 0; i < tickCount; i++) {
      const idx = Math.round((i / (tickCount - 1 || 1)) * (labels.length - 1));
      const x = PAD_X + idx * ((W - PAD_X * 2) / (labels.length - 1 || 1));
      tickValues.push({ label: labels[idx], x });
    }
  }

  return (
    <div>
      <svg
        role="img"
        aria-label={`نمودار ترافیک${labels && labels.length ? ` · ${labels[0]} تا ${labels[labels.length - 1]}` : ''}`}
        tabIndex={0}
        focusable="true"
        className="outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-lg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', maxHeight: height }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.26} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
            y2={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
            stroke="#1e293b"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        ))}
        {showZeroLine && (
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={H - PAD_BOTTOM}
            y2={H - PAD_BOTTOM}
            stroke="#1e293b"
            strokeWidth={1}
          />
        )}
        {showArea && areaD && <path d={areaD} fill={`url(#${gid})`} stroke="none" />}
        {lineD && (
          <path
            d={lineD}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {tickValues.length > 0 && (
        <div className="relative mt-2 h-4 text-[10px] text-slate-600">
          {tickValues.map((t, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2"
              style={{ left: `${(t.x / W) * 100}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
      <p className="sr-only">
        {clean.length > 0
          ? `حداقل ${Math.min(...clean)}، حداکثر ${Math.max(...clean)}، مجموع ${clean.reduce((a, b) => a + b, 0)}`
          : 'داده‌ای برای نمایش وجود ندارد'}
      </p>
    </div>
  );
}
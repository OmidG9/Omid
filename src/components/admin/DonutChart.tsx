'use client';

import { useId } from 'react';

export interface DonutSlice {
  key: string;
  value: number;
  color: string;
}

const R = 42;
const C = 2 * Math.PI * R;

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 120,
}: {
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const total = data.reduce((a, d) => a + d.value, 0);
  const thickness = Math.max(8, size / 10);

  // 0-based cumulative offsets
  let offset = 0;
  const segments = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0;
    const seg = {
      ...d,
      dash: frac * C,
      offset: offset * C,
    };
    offset += frac;
    return seg;
  });

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`نمودار توزیع: ${data.map((d) => `${d.key} ${Math.round((d.value / (total || 1)) * 100)}٪`).join('، ') || 'بدون داده'}`}
        tabIndex={0}
        focusable="true"
        className="outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-full"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          {segments.map((s, i) => (
            <clipPath key={i} id={`clip-${id}-${i}`}>
              <rect x="0" y="0" width={size} height={size} />
            </clipPath>
          ))}
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R * (size / 120)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={thickness}
        />
        {segments.map((s, i) =>
          s.value <= 0 ? null : (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={R * (size / 120)}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(s.dash - 2, 0)} ${C}`}
              strokeDashoffset={-s.offset * C}
              strokeLinecap="butt"
            />
          )
        )}
      </svg>
      <div className="flex-1">
        {centerValue && (
          <p className="text-2xl font-bold text-slate-100">{centerValue}</p>
        )}
        {centerLabel && <p className="text-xs text-slate-500">{centerLabel}</p>}
        <ul className="mt-2 space-y-1.5">
          {data.map((d) => (
            <li key={d.key} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
              <span className="text-slate-300 flex-1 truncate">{d.key}</span>
              <span className="text-slate-500">
                {total > 0
                  ? `${new Intl.NumberFormat('fa-IR').format(Math.round((d.value / total) * 100))}٪`
                  : '۰٪'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
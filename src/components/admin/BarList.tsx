export interface BarEntry {
  key: string;
  value: number;
  color?: string;
}

export default function BarList({
  data,
  showPercent = true,
  emptyTitle = 'هنوز داده‌ای ثبت نشده',
}: {
  data: BarEntry[];
  showPercent?: boolean;
  emptyTitle?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="text-xs text-slate-600 py-6 text-center">{emptyTitle}</p>;
  }
  return (
    <ul className="space-y-2.5">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <li key={d.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 truncate flex-1" title={d.key}>
                {d.key}
              </span>
              <span className="text-slate-500 font-medium tabular-nums ms-2">
                {new Intl.NumberFormat('fa-IR').format(d.value)}
              </span>
              {showPercent && (
                <span className="text-slate-600 tabular-nums w-10 text-left">
                  {max > 1
                    ? `${new Intl.NumberFormat('fa-IR').format(Math.round(pct))}٪`
                    : '۱۰۰٪'}
                </span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-slate-800/70 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(pct, d.value > 0 ? 2 : 0)}%`,
                  background: d.color ?? '#3b82f6',
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
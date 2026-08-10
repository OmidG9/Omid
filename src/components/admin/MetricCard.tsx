import type { LucideIcon } from 'lucide-react';
import type { PercentageChange } from '@/lib/utils/metrics';
import { formatChange } from '@/lib/utils/metrics';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export function TrendIndicator({
  change,
  hint,
}: {
  change: PercentageChange;
  hint?: string;
}) {
  const up = change.direction === 'up';
  const down = change.direction === 'down';
  const na = change.direction === 'na' && change.delta > 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        na || up ? 'text-emerald-400' : down ? 'text-red-400' : 'text-slate-500'
      }`}
    >
      {up || na ? (
        <ArrowUpRight size={14} />
      ) : down ? (
        <ArrowDownRight size={14} />
      ) : (
        <Minus size={14} />
      )}
      {formatChange(change)}
      {hint && <span className="text-slate-600 font-normal">{hint}</span>}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: PercentageChange;
  previousLabel?: string;
  accent?: boolean;
}

export default function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  previousLabel = 'vs previous period',
  accent,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon && (
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              accent
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
            }`}
          >
            <Icon size={15} />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-100">{value}</p>
      {change?.change !== undefined && (
        <div className="mt-2 flex items-center justify-between">
          <TrendIndicator change={change} hint={previousLabel} />
        </div>
      )}
    </div>
  );
}
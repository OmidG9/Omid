import type { ContactStatus } from '@/types/contacts';

const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: 'جدید',
  READ: 'خوانده‌شده',
  REPLIED: 'پاسخ‌داده‌شده',
  ARCHIVED: 'بایگانی‌شده',
  SPAM: 'اسپم',
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  NEW: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  READ: 'bg-slate-700/30 text-slate-300 border-slate-600/40',
  REPLIED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ARCHIVED: 'bg-slate-800/60 text-slate-500 border-slate-700/50',
  SPAM: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLE[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function HealthBadge({
  status,
}: {
  status: 'healthy' | 'warning' | 'critical';
}) {
  const label = {
    healthy: 'سالم',
    warning: 'هشدار',
    critical: 'بحرانی',
  } as const;
  const map = {
    healthy: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  } as const;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}
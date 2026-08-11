import { PageHeader, Card } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/StateViews';
import { HealthBadge } from '@/components/admin/StatusBadge';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getVisitors } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';
import { formatNumber, SOURCE_LABELS, DEVICE_LABELS } from '@/lib/utils/fa';

export default async function AnalyticsVisitorsPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const sessions = await getVisitors(range, 50);

  return (
    <div>
      <PageHeader
        title="بازدیدکنندگان"
        description={`نشست‌های اخیر · ${range.fromKey} تا ${range.toKey}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState
            title="هنوز نشستی ثبت نشده"
            description="به‌محض تعامل بازدیدکنندگان با سایت، نشست‌ها اینجا نمایش داده می‌شوند."
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Card title={`نشست‌ها (${formatNumber(sessions.length)})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="pb-2 pe-2 font-medium">منبع</th>
                    <th className="pb-2 pe-2 font-medium">صفحه فرود</th>
                    <th className="pb-2 pe-2 font-medium">دستگاه</th>
                    <th className="pb-2 pe-2 font-medium">صفحات</th>
                    <th className="pb-2 pe-2 font-medium">مدت‌زمان</th>
                    <th className="pb-2 pe-2 font-medium">آخرین فعالیت</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/50 text-xs text-slate-400">
                      <td className="py-2 pe-2">{SOURCE_LABELS[s.source] ?? s.source}</td>
                      <td className="py-2 pe-2 text-slate-300 max-w-[160px] truncate" title={s.landingPage} dir="ltr">{s.landingPage}</td>
                      <td className="py-2 pe-2">{DEVICE_LABELS[s.deviceType] ?? s.deviceType}</td>
                      <td className="py-2 pe-2 tabular-nums">{formatNumber(s.pageViews)}</td>
                      <td className="py-2 pe-2 tabular-nums">{formatDuration(s.durationMs)}</td>
                      <td className="py-2 pe-2 tabular-nums">{new Date(s.lastActivityAt).toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="text-xs text-slate-600">نمایش {formatNumber(sessions.length)} نشست اخیر در این بازه.</div>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (!ms) return '—';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${formatNumber(sec)} ثانیه`;
  const min = Math.floor(sec / 60);
  return `${formatNumber(min)} دقیقه و ${formatNumber(sec % 60)} ثانیه`;
}
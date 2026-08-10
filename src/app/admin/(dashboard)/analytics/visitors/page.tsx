import { PageHeader, Card } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/StateViews';
import { HealthBadge } from '@/components/admin/StatusBadge';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getVisitors } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

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
        title="Visitors"
        description={`Recent sessions · ${range.fromKey} → ${range.toKey}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState
            title="No sessions yet"
            description="Sessions appear here when visitors interact with the site."
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Card title={`Sessions (${sessions.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="pb-2 pr-2 font-medium">Source</th>
                    <th className="pb-2 pr-2 font-medium">Landing</th>
                    <th className="pb-2 pr-2 font-medium">Device</th>
                    <th className="pb-2 pr-2 font-medium">Pages</th>
                    <th className="pb-2 pr-2 font-medium">Duration</th>
                    <th className="pb-2 pr-2 font-medium">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/50 text-xs text-slate-400">
                      <td className="py-2 pr-2 capitalize">{s.source}</td>
                      <td className="py-2 pr-2 text-slate-300 max-w-[160px] truncate" title={s.landingPage}>{s.landingPage}</td>
                      <td className="py-2 pr-2 capitalize">{s.deviceType}</td>
                      <td className="py-2 pr-2 tabular-nums">{s.pageViews}</td>
                      <td className="py-2 pr-2 tabular-nums">{formatDuration(s.durationMs)}</td>
                      <td className="py-2 pr-2 tabular-nums">{new Date(s.lastActivityAt).toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="text-xs text-slate-600">Showing the most recent {sessions.length} sessions in range.</div>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (!ms) return '—';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}
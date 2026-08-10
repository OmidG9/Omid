import { PageHeader, Card } from '@/components/admin/Card';
import MetricCard from '@/components/admin/MetricCard';
import AnalyticsChart from '@/components/admin/AnalyticsChart';
import BarList from '@/components/admin/BarList';
import DonutChart from '@/components/admin/DonutChart';
import { EmptyState } from '@/components/admin/StateViews';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getOverview } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';
import { Users, Eye, Activity, Inbox } from 'lucide-react';

export default async function AnalyticsOverviewPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const data = await getOverview(range);
  const { metrics, compare } = data;
  const hasData = metrics.visitors > 0 || metrics.pageViews > 0;

  return (
    <div>
      <PageHeader
        title="Analytics Overview"
        description={`${data.fromKey} → ${data.toKey} · ${data.days} days`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {!hasData ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Visitors" value={metrics.visitors.toLocaleString()} icon={Users} change={compare.visitors} accent />
            <MetricCard label="Page Views" value={metrics.pageViews.toLocaleString()} icon={Eye} change={compare.pageViews} />
            <MetricCard label="Sessions" value={metrics.sessions.toLocaleString()} icon={Activity} />
            <MetricCard label="Contacts" value={metrics.contacts.toLocaleString()} icon={Inbox} change={compare.contacts} />
          </div>

          <Card title="Traffic Series" subtitle="Daily visitors vs page views">
            <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Visitors</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" /> Page views</span>
            </div>
            <div className="space-y-2">
              <AnalyticsChart values={data.series.map((s) => s.visitors)} labels={data.series.map((s) => s.date.slice(5))} />
              <AnalyticsChart values={data.series.map((s) => s.pageViews)} color="#475569" showArea={false} />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card title="Top Pages">
              <BarList data={data.topPages} />
            </Card>
            <Card title="Top Projects">
              <BarList data={data.topProjects} />
            </Card>
            <Card title="Traffic Sources">
              <DonutChart
                data={data.topSources.map((s) => ({
                  key: s.key,
                  value: s.value,
                  color: { direct: '#3b82f6', search: '#22d3ee', social: '#a78bfa', referral: '#f59e0b', campaign: '#34d399', other: '#64748b' }[s.key] ?? '#64748b',
                }))}
                centerValue={metrics.visitors.toLocaleString()}
                centerLabel="visitors"
              />
            </Card>
            <Card title="Devices">
              <DonutChart
                data={data.topDevices.map((d) => ({
                  key: d.key,
                  value: d.value,
                  color: { desktop: '#3b82f6', mobile: '#22d3ee', tablet: '#a78bfa' }[d.key] ?? '#64748b',
                }))}
                centerValue={metrics.visitors.toLocaleString()}
                centerLabel="visitors"
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
import Link from 'next/link';
import {
  Users,
  Eye,
  MousePointerClick,
  Inbox,
  TrendingUp,
  Activity,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { PageHeader, Card } from '@/components/admin/Card';
import MetricCard from '@/components/admin/MetricCard';
import AnalyticsChart from '@/components/admin/AnalyticsChart';
import BarList from '@/components/admin/BarList';
import DonutChart from '@/components/admin/DonutChart';
import { EmptyState } from '@/components/admin/StateViews';
import { HealthBadge } from '@/components/admin/StatusBadge';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getOverview } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

const SOURCE_COLORS: Record<string, string> = {
  direct: '#3b82f6',
  search: '#22d3ee',
  social: '#a78bfa',
  referral: '#f59e0b',
  campaign: '#34d399',
  other: '#64748b',
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const data = await getOverview(range);
  const { metrics, compare } = data;

  const hasData = metrics.visitors > 0 || metrics.pageViews > 0 || metrics.contacts > 0;
  const health: 'healthy' | 'warning' | 'critical' =
    data.alerts.length === 0
      ? 'healthy'
      : metrics.spam > 0 && metrics.formErrors > 0
        ? 'critical'
        : 'warning';

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Overview · ${data.fromKey} → ${data.toKey} · ${data.days} day${data.days > 1 ? 's' : ''}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {!hasData ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState
            title="No analytics yet"
            description="The tracking SDK is active. Data appears here as soon as the first page view is recorded."
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <MetricCard label="Visitors" value={metrics.visitors.toLocaleString()} icon={Users} change={compare.visitors} accent />
            <MetricCard label="Page Views" value={metrics.pageViews.toLocaleString()} icon={Eye} change={compare.pageViews} />
            <MetricCard label="Sessions" value={metrics.sessions.toLocaleString()} icon={Activity} />
            <MetricCard label="Project Views" value={metrics.projectViews.toLocaleString()} icon={TrendingUp} change={compare.projectViews} />
            <MetricCard label="Contacts" value={metrics.contacts.toLocaleString()} icon={Inbox} change={compare.contacts} />
          </div>

          {/* Alerts + insights */}
          {(data.alerts.length > 0 || data.insights.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.alerts.length > 0 && (
                <Card title="Alerts" action={<HealthBadge status={health} />}>
                  <ul className="space-y-2">
                    {data.alerts.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-300/90">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {data.insights.length > 0 && (
                <Card title="Insights">
                  <ul className="space-y-2">
                    {data.insights.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <Sparkles size={14} className="shrink-0 mt-0.5 text-blue-400" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {/* Traffic series */}
          <Card title="Traffic" subtitle="Visitors · Sessions · Page views per day">
            <div className="grid grid-cols-3 gap-2 mb-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Visitors</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Sessions</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" /> Page views</span>
            </div>
            <div className="space-y-2">
              <AnalyticsChart values={data.series.map((s) => s.visitors)} color="#3b82f6" labels={data.series.map((s) => s.date.slice(5))} />
              <AnalyticsChart values={data.series.map((s) => s.pageViews)} color="#475569" showArea={false} />
            </div>
          </Card>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <Card title="Top Pages">
              <BarList data={data.topPages} />
            </Card>
            <Card title="Top Projects">
              <BarList data={data.topProjects} />
            </Card>
            <Card title="Traffic Sources">
              <DonutChart
                data={data.topSources.map((s) => ({ key: s.key, value: s.value, color: SOURCE_COLORS[s.key] ?? '#64748b' }))}
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
            <Card title="Top Referrers">
              <BarList data={data.topReferrers} emptyTitle="No external referrers yet" />
            </Card>
            <Card title="Form Funnel" subtitle="View → Start → Success">
              <ul className="space-y-2.5">
                <FunnelRow label="Form views" value={metrics.formViews} />
                <FunnelRow label="Form starts" value={metrics.formStarts} />
                <FunnelRow label="Successful submissions" value={metrics.formSuccess} />
                <FunnelRow label="Errors" value={metrics.formErrors} />
              </ul>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Conversion" value={`${metrics.conversionRate.toFixed(1)}%`} />
                <Stat label="Start rate" value={`${metrics.startRate.toFixed(1)}%`} />
                <Stat label="Abandonment" value={`${metrics.abandonmentRate.toFixed(1)}%`} />
              </div>
            </Card>
          </div>

          <div className="text-xs text-slate-600">
            <Link href="/admin/analytics/overview" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Open full analytics →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function FunnelRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 font-medium tabular-nums">{value.toLocaleString()}</span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/40 border border-slate-800/80 p-2.5">
      <p className="text-base font-bold text-slate-100">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
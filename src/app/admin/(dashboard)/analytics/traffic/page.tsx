import { PageHeader, Card } from '@/components/admin/Card';
import DonutChart from '@/components/admin/DonutChart';
import BarList from '@/components/admin/BarList';
import { EmptyState } from '@/components/admin/StateViews';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getAnalyticsSubpage } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

const SOURCE_COLORS: Record<string, string> = {
  direct: '#3b82f6',
  search: '#22d3ee',
  social: '#a78bfa',
  referral: '#f59e0b',
  campaign: '#34d399',
  other: '#64748b',
};

export default async function AnalyticsTrafficPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const data = await getAnalyticsSubpage(range, 'traffic');
  if (data.kind !== 'traffic') return null;

  return (
    <div>
      <PageHeader
        title="Traffic"
        description={`Source channels · ${range.fromKey} → ${range.toKey}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {data.sources.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState title="No traffic data yet" />
        </div>
      ) : (
        <div className="space-y-4">
          <Card title="Source Channels">
            <DonutChart
              data={data.sources.map((s) => ({ key: s.key, value: s.value, color: SOURCE_COLORS[s.key] ?? '#64748b' }))}
              centerValue={data.sources.reduce((a, s) => a + s.value, 0).toLocaleString()}
              centerLabel="visits"
            />
          </Card>
        </div>
      )}
    </div>
  );
}
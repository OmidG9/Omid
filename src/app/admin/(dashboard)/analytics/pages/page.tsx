import { PageHeader, Card } from '@/components/admin/Card';
import BarList from '@/components/admin/BarList';
import { EmptyState } from '@/components/admin/StateViews';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getAnalyticsSubpage } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';

export default async function AnalyticsPagesPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const data = await getAnalyticsSubpage(range, 'pages');
  if (data.kind !== 'pages') return null;

  return (
    <div>
      <PageHeader
        title="Pages"
        description={`Top pages by views · ${range.fromKey} → ${range.toKey}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState title="No page views yet" />
        </div>
      ) : (
        <Card title={`Total ${data.totals.toLocaleString()} page views`}>
          <BarList data={data.items} />
        </Card>
      )}
    </div>
  );
}
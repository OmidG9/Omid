import { PageHeader, Card } from '@/components/admin/Card';
import DonutChart from '@/components/admin/DonutChart';
import BarList from '@/components/admin/BarList';
import { EmptyState } from '@/components/admin/StateViews';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getAnalyticsSubpage } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';
import { formatNumber, formatDateKey } from '@/lib/utils/fa';

export default async function AnalyticsDevicesPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const data = await getAnalyticsSubpage(range, 'devices');
  if (data.kind !== 'devices') return null;

  const empty = data.items.length === 0;

  return (
    <div>
      <PageHeader
        title="دستگاه‌ها"
        description={`تفکیک دستگاه و پلتفرم · ${formatDateKey(range.fromKey)} تا ${formatDateKey(range.toKey)}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {empty ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="نوع دستگاه">
            <DonutChart
              data={data.items.map((d) => ({
                key: d.key,
                value: d.value,
                color: { desktop: '#3b82f6', mobile: '#22d3ee', tablet: '#a78bfa' }[d.key] ?? '#64748b',
              }))}
              centerValue={formatNumber(data.items.reduce((a, d) => a + d.value, 0))}
              centerLabel="بازدیدکننده"
            />
          </Card>
          <Card title="مرورگرها">
            <BarList data={data.browsers} />
          </Card>
          <Card title="سیستم‌عامل‌ها">
            <BarList data={data.os} />
          </Card>
        </div>
      )}
    </div>
  );
}
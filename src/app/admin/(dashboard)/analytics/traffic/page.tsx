import { PageHeader, Card } from '@/components/admin/Card';
import DonutChart from '@/components/admin/DonutChart';
import BarList from '@/components/admin/BarList';
import { EmptyState } from '@/components/admin/StateViews';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getAnalyticsSubpage } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';
import { formatNumber, formatDateKey, SOURCE_LABELS } from '@/lib/utils/fa';
import { SOURCE_COLORS } from '@/lib/utils/chartTheme';

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
        title="ترافیک"
        description={`کانال‌های منبع · ${formatDateKey(range.fromKey)} تا ${formatDateKey(range.toKey)}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {data.sources.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState title="هنوز دادهٔ ترافیکی ثبت نشده" />
        </div>
      ) : (
        <div className="space-y-4">
          <Card title="کانال‌های منبع">
            <DonutChart
              data={data.sources.map((s) => ({ key: SOURCE_LABELS[s.key] ?? s.key, value: s.value, color: SOURCE_COLORS[s.key] ?? '#64748b' }))}
              centerValue={formatNumber(data.sources.reduce((a, s) => a + s.value, 0))}
              centerLabel="بازدید"
            />
          </Card>
        </div>
      )}
    </div>
  );
}
import { PageHeader, Card } from '@/components/admin/Card';
import BarList from '@/components/admin/BarList';
import { EmptyState } from '@/components/admin/StateViews';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getAnalyticsSubpage } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';
import { formatNumber, formatDateKey } from '@/lib/utils/fa';

export default async function AnalyticsProjectsPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const data = await getAnalyticsSubpage(range, 'projects');
  if (data.kind !== 'projects') return null;

  return (
    <div>
      <PageHeader
        title="پروژه‌ها"
        description={`پربازدیدترین پروژه‌ها · ${formatDateKey(range.fromKey)} تا ${formatDateKey(range.toKey)}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState
            title="هنوز بازدیدی از پروژه‌ها ثبت نشده"
            description="بازدید از پروژه‌ها هنگام باز کردن صفحهٔ یک پروژه ثبت می‌شود."
          />
        </div>
      ) : (
        <Card title={`مجموع ${formatNumber(data.totals)} بازدید از پروژه‌ها`}>
          <BarList data={data.items} />
        </Card>
      )}
    </div>
  );
}
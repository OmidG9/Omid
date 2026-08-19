import { PageHeader, Card } from '@/components/admin/Card';
import MetricCard from '@/components/admin/MetricCard';
import MultiLineChart from '@/components/admin/MultiLineChart';
import BarList from '@/components/admin/BarList';
import DonutChart from '@/components/admin/DonutChart';
import { EmptyState } from '@/components/admin/StateViews';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getOverview } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';
import { Users, Eye, Activity, Inbox } from 'lucide-react';
import { SOURCE_COLORS, DEVICE_COLORS, CHART_COLORS } from '@/lib/utils/chartTheme';
import {
  formatNumber,
  formatDateKey,
  SOURCE_LABELS,
  DEVICE_LABELS,
} from '@/lib/utils/fa';

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
        title="نمای کلی آمار"
        description={`${formatDateKey(data.fromKey)} تا ${formatDateKey(data.toKey)} · ${formatNumber(data.days)} روز`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {!hasData ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="بازدیدکنندگان" value={formatNumber(metrics.visitors)} icon={Users} change={compare.visitors} accent />
            <MetricCard label="بازدید صفحات" value={formatNumber(metrics.pageViews)} icon={Eye} change={compare.pageViews} />
            <MetricCard label="نشست‌ها" value={formatNumber(metrics.sessions)} icon={Activity} />
            <MetricCard label="تماس‌ها" value={formatNumber(metrics.contacts)} icon={Inbox} change={compare.contacts} />
          </div>

          <Card title="سری ترافیک" subtitle="بازدیدکنندگان روزانه در برابر بازدید صفحات">
            <MultiLineChart
              series={[
                { id: 'visitors', name: 'بازدیدکنندگان', color: CHART_COLORS.blue, values: data.series.map((s) => s.visitors) },
                { id: 'pageViews', name: 'بازدید صفحات', color: CHART_COLORS.darkSlate, values: data.series.map((s) => s.pageViews) },
              ]}
              labels={data.series.map((s) => formatDateKey(s.date).slice(5))}
              tooltipLabels={data.series.map((s) => formatDateKey(s.date))}
            />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card title="پربازدیدترین صفحات">
              <BarList data={data.topPages} />
            </Card>
            <Card title="پربازدیدترین پروژه‌ها">
              <BarList data={data.topProjects} />
            </Card>
            <Card title="منابع ترافیک">
              <DonutChart
                data={data.topSources.map((s) => ({
                  key: SOURCE_LABELS[s.key] ?? s.key,
                  value: s.value,
                  color: SOURCE_COLORS[s.key] ?? '#64748b',
                }))}
                centerValue={formatNumber(metrics.visitors)}
                centerLabel="بازدیدکننده"
              />
            </Card>
            <Card title="دستگاه‌ها">
              <DonutChart
                data={data.topDevices.map((d) => ({
                  key: DEVICE_LABELS[d.key] ?? d.key,
                  value: d.value,
                  color: DEVICE_COLORS[d.key] ?? '#64748b',
                }))}
                centerValue={formatNumber(metrics.visitors)}
                centerLabel="بازدیدکننده"
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
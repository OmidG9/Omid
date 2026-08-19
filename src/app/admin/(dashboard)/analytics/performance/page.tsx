import { PageHeader, Card } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/StateViews';
import { HealthBadge } from '@/components/admin/StatusBadge';
import BarList from '@/components/admin/BarList';
import FunnelChart from '@/components/admin/FunnelChart';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getPerformance, getHealth } from '@/lib/services/analyticsService';
import { parseRange } from '@/lib/services/rangeParam';
import { formatNumber, formatDateKey } from '@/lib/utils/fa';
import { CHART_COLORS } from '@/lib/utils/chartTheme';

export default async function AnalyticsPerformancePage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const [performance, health] = await Promise.all([
    getPerformance(range),
    getHealth(range),
  ]);

  const empty = performance.formViews === 0 && performance.formStarts === 0;
  const healthState: 'healthy' | 'warning' | 'critical' =
    health.spamRate > 20
      ? 'critical'
      : health.formErrors > 0 || health.spam > 0
        ? 'warning'
        : 'healthy';

  return (
    <div>
      <PageHeader
        title="عملکرد فرم"
        description={`قیف فرم تماس و سلامت · ${formatDateKey(range.fromKey)} تا ${formatDateKey(range.toKey)}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {empty ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState title="هنوز فعالیتی در فرم ثبت نشده" description="شاخص‌های قیف فرم پس از تعامل بازدیدکنندگان با فرم تماس نمایش داده می‌شوند." />
        </div>
      ) : (
        <div className="space-y-4">
          <Card
            title="قیف فرم"
            subtitle="مشاهده فرم تماس ← شروع ← ارسال موفق"
            action={<HealthBadge status={healthState} />}
          >
                        <FunnelChart
              steps={[
                { label: 'مشاهده‌های فرم', value: performance.formViews, color: CHART_COLORS.blue },
                { label: 'شروع‌های فرم', value: performance.formStarts, color: CHART_COLORS.cyan },
                { label: 'ارسال‌های موفق', value: performance.formSuccess, color: CHART_COLORS.emerald },
                { label: 'خطاها', value: performance.formErrors, color: CHART_COLORS.red },
              ]}
              emptyLabel="هنوز فعالیتی در فرم ثبت نشده"
            />
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="نرخ تبدیل" value={`${performance.conversionRate.toFixed(1)}٪`} sub={`از ${formatNumber(performance.formViews)} مشاهده`} />
            <Metric label="نرخ شروع" value={`${performance.startRate.toFixed(1)}٪`} sub="شروع / مشاهده" />
            <Metric label="نرخ ارسال" value={`${performance.submissionRate.toFixed(1)}٪`} sub="موفق / شروع" />
            <Metric label="رهاسازی" value={`${performance.abandonmentRate.toFixed(1)}٪`} sub="(شروع − موفق) / شروع" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="سلامت ارسال‌ها" subtitle="هرزنامه در برابر ارسال‌های معتبر">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <StatRow label="تماس‌ها" value={formatNumber(health.contacts)} />
                <StatRow label="هرزنامه" value={formatNumber(health.spam)} />
                <StatRow label="نرخ هرزنامه" value={`${health.spamRate.toFixed(1)}٪`} />
                <StatRow label="کلیک‌های خروجی" value={formatNumber(health.outboundClicks)} />
              </div>
            </Card>
            <Card title="انواع خطا">
              <BarList data={performance.errorTypes} emptyTitle="خطایی ثبت نشده" />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
      <p className="text-xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-800/40 border border-slate-800/80 p-3">
      <p className="text-lg font-bold text-slate-100">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
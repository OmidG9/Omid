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
import TrafficChart from '@/components/admin/TrafficChart';
import BarList from '@/components/admin/BarList';
import DonutChart from '@/components/admin/DonutChart';
import FunnelChart from '@/components/admin/FunnelChart';
import { EmptyState } from '@/components/admin/StateViews';
import { HealthBadge, StatusBadge } from '@/components/admin/StatusBadge';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getOverview, getHealth } from '@/lib/services/analyticsService';
import { getStore } from '@/lib/db';
import { parseRange } from '@/lib/services/rangeParam';
import type { ContactStatus } from '@/types/contacts';
import { SOURCE_COLORS, DEVICE_COLORS, CHART_COLORS } from '@/lib/utils/chartTheme';
import {
  formatNumber,
  formatPercent,
  formatDateKey,
  SOURCE_LABELS,
  DEVICE_LABELS,
} from '@/lib/utils/fa';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);
  const data = await getOverview(range);
  const healthData = await getHealth(range);
  const recent = await getStore().recentContacts(5);
  const { metrics, compare, previous } = data;

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
        title="داشبورد"
        description={`نمای کلی · ${formatDateKey(data.fromKey)} تا ${formatDateKey(data.toKey)} · ${formatNumber(data.days)} روز`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {!hasData ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState
            title="هنوز آماری ثبت نشده"
            description="اس‌دی‌کی ردیابی فعال است. به‌محض ثبت اولین بازدید صفحه، داده‌ها اینجا نمایش داده می‌شوند."
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard label="بازدیدکنندگان" value={formatNumber(metrics.visitors)} icon={Users} change={compare.visitors} previousValue={formatNumber(previous.visitors)} accent />
            <MetricCard label="بازدید صفحات" value={formatNumber(metrics.pageViews)} icon={Eye} change={compare.pageViews} previousValue={formatNumber(previous.pageViews)} />
            <MetricCard label="نشست‌ها" value={formatNumber(metrics.sessions)} icon={Activity} change={compare.sessions} previousValue={formatNumber(previous.sessions)} />
            <MetricCard label="بازدید پروژه‌ها" value={formatNumber(metrics.projectViews)} icon={TrendingUp} change={compare.projectViews} previousValue={formatNumber(previous.projectViews)} />
            <MetricCard label="تماس‌ها" value={formatNumber(metrics.contacts)} icon={Inbox} change={compare.contacts} previousValue={formatNumber(previous.contacts)} />
            <MetricCard label="نرخ تبدیل" value={formatPercent(metrics.conversionRate)} icon={MousePointerClick} change={compare.conversionRate} previousValue={formatPercent(previous.conversionRate)} />
          </div>

          {/* Alerts + insights */}
          {(data.alerts.length > 0 || data.insights.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.alerts.length > 0 && (
                <Card title="هشدارها" action={<HealthBadge status={health} />}>
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
                <Card title="بینش‌ها">
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
          <Card title="ترافیک" subtitle="بازدیدکنندگان · نشست‌ها · بازدید صفحات">
            <TrafficChart series={data.series} />
          </Card>

          {/* Recent contact requests */}
          <RecentRequests contacts={recent} />

          {/* Form Health */}
          <Card title="سلامت فرم" subtitle="خطاها و نسبت اسپم به ارسال‌های واقعی">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <HealthStat label="ارسال‌های واقعی" value={formatNumber(healthData.contacts)} tone="ok" />
              <HealthStat label="اسپم" value={formatNumber(healthData.spam)} tone={healthData.spamRate >= 10 ? 'bad' : 'ok'} />
              <HealthStat label="نرخ اسپم" value={formatPercent(healthData.spamRate)} tone={healthData.spamRate >= 10 ? 'bad' : 'ok'} />
              <HealthStat label="خطاهای فرم" value={formatNumber(healthData.formErrors)} tone={healthData.formErrors > 0 ? 'bad' : 'ok'} />
            </div>
            {healthData.spamRate >= 10 && (
              <p className="mt-3 text-xs text-amber-300/90">نرخ اسپم بالا است — تنظیمات تشخیص هرزنامه را بررسی کنید.</p>
            )}
          </Card>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <Card title="پربازدیدترین صفحات">
              <BarList data={data.topPages} />
            </Card>
            <Card title="پربازدیدترین پروژه‌ها">
              <BarList data={data.topProjects} />
            </Card>
            <Card title="منابع ترافیک">
              <DonutChart
                data={data.topSources.map((s) => ({ key: SOURCE_LABELS[s.key] ?? s.key, value: s.value, color: SOURCE_COLORS[s.key] ?? '#64748b' }))}
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
            <Card title="منابع ارجاع‌دهنده">
              <BarList data={data.topReferrers} emptyTitle="هنوز ارجاع خارجی ثبت نشده" />
            </Card>
            <Card title="قیف فرم" subtitle="بازدید ← شروع ← موفقیت">
              <FunnelChart
                steps={[
                  { label: 'بازدید از فرم', value: metrics.formViews, color: CHART_COLORS.blue },
                  { label: 'شروع فرم', value: metrics.formStarts, color: CHART_COLORS.cyan },
                  { label: 'ارسال موفق', value: metrics.formSuccess, color: CHART_COLORS.emerald },
                  { label: 'خطاها', value: metrics.formErrors, color: CHART_COLORS.red },
                ]}
                emptyLabel="هنوز فعالیتی در فرم ثبت نشده"
              />
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <Stat label="نرخ تبدیل" value={formatPercent(metrics.conversionRate)} />
                <Stat label="نرخ شروع" value={formatPercent(metrics.startRate)} />
                <Stat label="رهاسازی" value={formatPercent(metrics.abandonmentRate)} />
              </div>
            </Card>
          </div>

          <div className="text-xs text-slate-600">
            <Link href="/admin/analytics/overview" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              مشاهده آمار کامل ←
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function RecentRequests({ contacts }: { contacts: { id: string; name: string; email: string; status: string; createdAt: number }[] }) {
  if (contacts.length === 0) return null;
  return (
    <Card title="آخرین درخواست‌های تماس" action={<Link href="/admin/contacts" className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">همه</Link>}>
      <ul className="divide-y divide-slate-800/50">
        {contacts.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2">
            <Link href={`/admin/contacts/${c.id}`} className="min-w-0 flex items-center gap-2 group">
              <span className="w-2 h-2 rounded-full bg-blue-500/70 shrink-0" />
              <span className="text-xs text-slate-300 group-hover:text-white truncate">{c.name}</span>
              <span className="text-[11px] text-slate-500 truncate" dir="ltr">{c.email}</span>
            </Link>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-slate-600 tabular-nums">{new Date(c.createdAt).toLocaleString('fa-IR')}</span>
              <StatusBadge status={c.status as ContactStatus} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
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

function HealthStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'ok' | 'bad';
}) {
  return (
    <div className="rounded-lg bg-slate-800/40 border border-slate-800/80 p-3">
      <p className={`text-base font-bold tabular-nums ${tone === 'bad' ? 'text-amber-300' : 'text-slate-100'}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
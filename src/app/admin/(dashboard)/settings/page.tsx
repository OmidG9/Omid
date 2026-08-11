import { PageHeader, Card } from '@/components/admin/Card';
import { getStore } from '@/lib/db';
import { storeBackend } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getHealthSnapshot } from '@/lib/services/healthService';
import { formatNumber } from '@/lib/utils/fa';
import SettingsForm from '@/components/admin/SettingsForm';

export const metadata = { title: 'تنظیمات' };

function agoLabel(sec: number | null, unit: string): string {
  if (sec === null) return '—';
  if (sec < 0) return 'هنوز داده‌ای نیست';
  if (sec < 60) return `${sec} ثانیه پیش`;
  if (sec < 3600) return `${Math.floor(sec / 60)} دقیقه پیش`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} ساعت پیش`;
  return `${Math.floor(sec / 86400)} روز پیش`;
}

export default async function SettingsPage() {
  const backend = storeBackend();
  const store = getStore();
  const settings = await getSettings();
  const health = await getHealthSnapshot();

  let stats: { label: string; value: string }[] = [];
  try {
    const dates = await store.getActiveMetricDates('0000-01-01', '9999-12-31');
    const contacts = await store.allContactIds(10000);
    stats = [
      { label: 'پشتیبان ذخیره‌سازی', value: backend },
      { label: 'روزهای دارای داده', value: formatNumber(dates.length) },
      { label: 'تماس‌های ذخیره‌شده', value: formatNumber(contacts.length) },
    ];
  } catch {
    stats = [{ label: 'پشتیبان ذخیره‌سازی', value: backend }];
  }

  return (
    <div>
      <PageHeader title="تنظیمات" description="پیکربندی، آستانه‌ها و وضعیت ذخیره‌سازی." />

      <div className="space-y-4">
        <Card title="ذخیره‌سازی">
          <dl className="space-y-2 text-sm">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">{s.label}</dt>
                <dd className="text-slate-300 text-right" dir={s.label === 'پشتیبان ذخیره‌سازی' ? 'ltr' : undefined}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="سلامت سیستم" subtitle="وضعیت زنده‌ی مسیرهای اصلی: تحلیلها، فرم تماس و ایمیل (§۶.۱).">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">آخرین رویداد تحلیلی</dt>
              <dd className="text-slate-300">{agoLabel(health.lastEventAgeSec, 'event')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">آخرین ارسال فرم</dt>
              <dd className="text-slate-300">{agoLabel(health.contact.ageSec, 'submission')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">وضعیت آخرین ایمیل</dt>
              <dd className="text-slate-300">
                {health.contact.emailSentOk === null
                  ? '—'
                  : health.contact.emailSentOk
                    ? 'ارسال موفق'
                    : 'خطا در ارسال'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">نرخ خطای فرم (۳۰ روز)</dt>
              <dd className="text-slate-300" dir="ltr">
                {health.contact.errorRatePct}٪
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Redis</dt>
              <dd className="text-slate-300">
                {health.redis.configured
                  ? health.redis.reachable
                    ? 'متصل و قابل دسترس'
                    : 'پیکربندی شده اما در دسترس نیست'
                  : 'پیکربندی نشده (مکانیزم حافظه)'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="آستانه‌ها" subtitle="مقادیر واقعی از ذخیره‌سازی خوانده می‌شوند و بلافاصله در رفتار سیستم اعمال می‌شوند (§۲۳، §۲۴).">
          <SettingsForm initial={settings} />
        </Card>

        <Card title="تعریف معیارها" subtitle="واحد‌های تحلیل و تعریف دقیق اعداد (ref: METRICS.md) (§۶.۲).">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">بازدیدکننده (Visitor)</dt>
              <dd className="text-slate-300 text-right">مرورگر ناشناس با کوکی <span dir="ltr">ano_vid</span></dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">نشست (Session)</dt>
              <dd className="text-slate-300 text-right">بازه‌ی فعالیت پیوسته با کوکی <span dir="ltr">ano_sid</span></dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">نرخ تبدیل (Conversion)</dt>
              <dd className="text-slate-300 text-right">Successful Contact Stored ÷ بازدیدهای فرم</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">بازگشت (Bounce)</dt>
              <dd className="text-slate-300 text-right">نشست بدون رویداد PAGE_VIEW ÷ کل نشست‌ها</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">بازگشت‌کننده (Returning)</dt>
              <dd className="text-slate-300 text-right">اولین رویداد visitor خارج از بازه</dd>
            </div>
          </dl>
        </Card>

        <Card title="محیط اجرا" subtitle="وضعیت پیکربندی غیرحساس.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-800/40 border border-slate-800/80 p-3">
              <span className="text-slate-500">ADMIN_SECRET</span>
              <span className="text-slate-300">{process.env.ADMIN_SECRET ? 'پیکربندی‌شده' : 'تنظیم نشده'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-800/40 border border-slate-800/80 p-3">
              <span className="text-slate-500">UPSTASH_REDIS</span>
              <span className="text-slate-300">{backend === 'redis' ? 'متصل' : 'پیکربندی نشده (مکانیزم حافظه)'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
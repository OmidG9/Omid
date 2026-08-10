import { PageHeader, Card } from '@/components/admin/Card';
import { getStore } from '@/lib/db';
import { storeBackend } from '@/lib/db';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const backend = storeBackend();
  const store = getStore();

  let stats: { label: string; value: string }[] = [];
  try {
    const dates = await store.getActiveMetricDates('0000-01-01', '9999-12-31');
    const contacts = await store.allContactIds(10000);
    stats = [
      { label: 'Storage backend', value: backend },
      { label: 'Active metric days', value: String(dates.length) },
      { label: 'Stored contacts', value: String(contacts.length) },
    ];
  } catch {
    stats = [{ label: 'Storage backend', value: backend }];
  }

  return (
    <div>
      <PageHeader title="Settings" description="Configuration, thresholds, and storage state." />

      <div className="space-y-4">
        <Card title="Storage">
          <dl className="space-y-2 text-sm">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">{s.label}</dt>
                <dd className="text-slate-300 text-right" dir={s.label === 'Storage backend' ? 'ltr' : undefined}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Thresholds" subtitle="Defaults for the current MVP. Applied on next deploy via env/config.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Threshold label="Rate limit" value="5 / IP / 10 min" />
            <Threshold label="Duplicate window" value="24 hours" />
            <Threshold label="Spam threshold" value="score ≥ 60" />
            <Threshold label="Event retention" value="90 days" />
            <Threshold label="Session retention" value="90 days" />
            <Threshold label="Security retention" value="90 days" />
          </div>
        </Card>

        <Card title="Environment" subtitle="Non-sensitive configuration state.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-800/40 border border-slate-800/80 p-3">
              <span className="text-slate-500">ADMIN_SECRET</span>
              <span className="text-slate-300">{process.env.ADMIN_SECRET ? 'configured' : 'not set'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-800/40 border border-slate-800/80 p-3">
              <span className="text-slate-500">UPSTASH_REDIS</span>
              <span className="text-slate-300">{backend === 'redis' ? 'connected' : 'not configured (memory fallback)'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Threshold({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/40 border border-slate-800/80 p-3">
      <p className="text-base font-bold text-slate-100">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
import { PageHeader, Card } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/StateViews';
import { HealthBadge } from '@/components/admin/StatusBadge';
import DonutChart from '@/components/admin/DonutChart';
import { getStore } from '@/lib/db';

const TYPE_COLORS: Record<string, string> = {
  SPAM_DETECTED: '#ef4444',
  RATE_LIMIT_TRIGGERED: '#f59e0b',
  INVALID_PAYLOAD: '#8b5cf6',
  SUSPICIOUS_REQUEST: '#f97316',
  BLOCKED_REQUEST: '#dc2626',
  AUTH_FAILURE: '#3b82f6',
};

export const metadata = { title: 'Security' };

export default async function SecurityPage() {
  const store = getStore();
  const to = Date.now();
  const from = to - 30 * 86_400_000;
  const [events, counts] = await Promise.all([
    store.listSecurityEvents({ from, to, limit: 100 }),
    store.countSecurityByType(from, to),
  ]);

  const total = events.length;
  const hasSpam = (counts.SPAM_DETECTED ?? 0) > 0;
  const health: 'healthy' | 'warning' | 'critical' =
    (counts.BLOCKED_REQUEST ?? 0) > 0 || (counts.SPAM_DETECTED ?? 0) >= 10
      ? 'critical'
      : hasSpam || (counts.AUTH_FAILURE ?? 0) > 0
        ? 'warning'
        : 'healthy';

  return (
    <div>
      <PageHeader
        title="Security"
        description={`Last 30 days · ${total} event${total === 1 ? '' : 's'}`}
        actions={<HealthBadge status={health} />}
      />

      {total === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState
            title="No security events"
            description="Events appear here when the system detects spam, rate limiting, auth failures, or blocked requests."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="By Type">
              <DonutChart
                data={Object.entries(counts).map(([key, value]) => ({
                  key,
                  value,
                  color: TYPE_COLORS[key] ?? '#64748b',
                }))}
                centerValue={total.toLocaleString()}
                centerLabel="events"
              />
            </Card>

            <div className="md:col-span-2">
              <Card title="Recent Events" subtitle="Newest first">
                <div className="space-y-2">
                  {events.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                      <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: TYPE_COLORS[e.type] ?? '#64748b' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-200">{e.type}</p>
                          <p className="text-[10px] text-slate-600 tabular-nums shrink-0">{new Date(e.at).toLocaleString('fa-IR')}</p>
                        </div>
                        {e.reason && <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={e.reason}>{e.reason}</p>}
                        <p className="text-[10px] text-slate-600 mt-0.5" dir="ltr">{e.path ?? '—'} {e.ip && `· ${e.ip}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
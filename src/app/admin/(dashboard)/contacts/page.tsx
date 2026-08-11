import Link from 'next/link';
import { PageHeader, Card } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/StateViews';
import { StatusBadge } from '@/components/admin/StatusBadge';
import DateRangePicker, { type RangeMode } from '@/components/admin/DateRangePicker';
import { getStore } from '@/lib/db';
import { parseRange } from '@/lib/services/rangeParam';
import { CONTACT_STATUS } from '@/types/contacts';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: {
    range?: string;
    from?: string;
    to?: string;
    page?: string;
    status?: string;
    q?: string;
  };
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const status = (searchParams.status ?? 'ALL') as string;
  const q = searchParams.q ?? '';
  const range = parseRange(searchParams.range, searchParams.from, searchParams.to);

  const result = await getStore().listContacts({
    page,
    pageSize: 25,
    status: status as never,
    q: q || undefined,
    fromKey: range.fromKey,
    toKey: range.toKey,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${result.total} request${result.total === 1 ? '' : 's'} · ${range.fromKey} → ${range.toKey}`}
        actions={<DateRangePicker mode={(searchParams.range as RangeMode) ?? '30'} from={searchParams.from} to={searchParams.to} />}
      />

      {/* Status filter */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {['ALL', ...Object.values(CONTACT_STATUS)].map((s) => (
          <Link
            key={s}
            href={withParam('status', s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              status === s
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <EmptyState
            title="No requests yet"
            description="Contact form submissions will appear here."
          />
        </div>
      ) : (
        <Card title={`Page ${result.page} of ${totalPages}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="pb-2 pr-2 font-medium">From</th>
                  <th className="pb-2 pr-2 font-medium">Email</th>
                  <th className="pb-2 pr-2 font-medium">Status</th>
                  <th className="pb-2 pr-2 font-medium">Source</th>
                  <th className="pb-2 pr-2 font-medium">Received</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {result.items.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/50 text-xs text-slate-400">
                    <td className="py-2.5 pr-2 text-slate-200 font-medium">{c.name}</td>
                    <td className="py-2.5 pr-2 text-slate-400" dir="ltr">{c.email}</td>
                    <td className="py-2.5 pr-2"><StatusBadge status={c.status} /></td>
                    <td className="py-2.5 pr-2 capitalize">{c.source}</td>
                    <td className="py-2.5 pr-2 tabular-nums">{new Date(c.createdAt).toLocaleString('fa-IR')}</td>
                    <td className="py-2.5 text-right">
                      <Link href={`/admin/contacts/${c.id}`} className="text-blue-400 hover:text-blue-300 text-xs underline underline-offset-2">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={withParam('page', String(p))}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium border transition-colors ${
                p === page
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  function withParam(name: string, value: string): string {
    const params = new URLSearchParams();
    if (searchParams.range) params.set('range', searchParams.range);
    if (searchParams.from) params.set('from', searchParams.from);
    if (searchParams.to) params.set('to', searchParams.to);
    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.status && searchParams.status !== 'ALL') params.set('status', searchParams.status);
    params.set(name, value);
    return `/admin/contacts?${params.toString()}`;
  }
}
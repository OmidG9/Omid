import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card } from '@/components/admin/Card';
import ContactStatusControl from '@/components/admin/ContactStatusControl';
import { getStore } from '@/lib/db';
import { Mail, ArrowRight, ChevronDown, History, ExternalLink } from 'lucide-react';
import { SOURCE_LABELS, DEVICE_LABELS } from '@/lib/utils/fa';

export const metadata = { title: 'تماس' };

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const contact = await getStore().getContact(params.id);
  if (!contact) notFound();

  const technical = [
    { label: 'دستگاه', value: DEVICE_LABELS[contact.deviceType ?? ''] ?? contact.deviceType ?? '—' },
    { label: 'مرورگر', value: contact.browser ?? '—', ltr: true },
    { label: 'سیستم‌عامل', value: contact.os ?? '—', ltr: true },
    { label: 'پردازش', value: contact.processing, ltr: true },
    { label: 'امتیاز هرزنامه', value: contact.spamScore > 0 ? `${contact.spamScore}/۱۰۰` : '۰/۱۰۰' },
  ];

  return (
    <div>
      <PageHeader
        title={contact.name}
        description={`${contact.email} · دریافت‌شده ${new Date(contact.createdAt).toLocaleString('fa-IR')}`}
        actions={
          <a href={`mailto:${contact.email}`} className="btn-secondary flex items-center gap-2 text-sm">
            <Mail size={14} />
            پاسخ
          </a>
        }
      />

      <div className="space-y-4">
        <Card title="مدیریت">
          <ContactStatusControl contact={contact} />
        </Card>

        <Card title="پیام">
          {contact.subject && (
            <p className="text-xs text-slate-500 mb-2">موضوع: {contact.subject}</p>
          )}
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{contact.message}</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="منبع و ارجاع">
            <dl className="space-y-2 text-sm">
              <Row label="منبع" value={SOURCE_LABELS[contact.source] ?? contact.source} />
              <Row label="ارجاع‌دهنده" value={contact.referrer ?? '—'} dir={contact.referrer ? 'ltr' : undefined} />
              <Row label="صفحهٔ فرود" value={contact.landingPage ?? '—'} dir={contact.landingPage ? 'ltr' : undefined} />
              <Row label="پروژه" value={contact.projectSlug ?? '—'}>
                {contact.projectSlug && (
                  <Link
                    href={`/projects/${contact.projectSlug}`}
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs underline underline-offset-2"
                  >
                    <ExternalLink size={12} />
                    مشاهده
                  </Link>
                )}
              </Row>
            </dl>
          </Card>
          <TechnicalCard rows={technical} />
        </div>

        <Card title="تایملاین" subtitle="سیر سفر بازدیدکننده تا ثبت درخواست">
          <Timeline events={contact.timeline} />
        </Card>

        {contact.spamFlags.length > 0 && (
          <Card title="علل هرزنامه">
            <div className="flex flex-wrap gap-2">
              {contact.spamFlags.map((f) => (
                <span key={f} className="px-2 py-1 text-[11px] rounded-full bg-red-500/10 text-red-300 border border-red-500/20" dir="ltr">
                  {f}
                </span>
              ))}
            </div>
          </Card>
        )}

        <Link href="/admin/contacts" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
          <ArrowRight size={14} />
          بازگشت به تماس‌ها
        </Link>
      </div>
    </div>
  );
}

function Timeline({ events }: { events: { name: string; at: number; detail?: string }[] }) {
  if (!events.length) {
    return <p className="text-xs text-slate-500">رویدادی ثبت نشده است.</p>;
  }
  const ordered = [...events].sort((a, b) => {
    const diff = a.at - b.at;
    return diff !== 0 ? diff : events.indexOf(a) - events.indexOf(b);
  });
  return (
    <ol className="relative border-s border-slate-800 ms-2 space-y-5 py-1">
      {ordered.map((e, i) => (
        <li key={i} className="ms-6 relative">
          <span className="absolute -start-[30px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500/70 ring-4 ring-slate-900" />
          <p className="text-xs font-medium text-slate-200">{e.name}</p>
          <p className="text-[11px] text-slate-500 mt-0.5" dir="ltr">
            {new Date(e.at).toLocaleString('fa-IR')}
          </p>
          {e.detail && (
            <p className="text-[11px] text-slate-500 mt-0.5" dir="ltr">{e.detail}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

function TechnicalCard({ rows }: { rows: { label: string; value: string; ltr?: boolean }[] }) {
  return (
    <details className="group rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <History size={14} className="text-slate-500" />
          مشخصات فنی
        </div>
        <ChevronDown size={14} className="text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map((r) => (
          <Row key={r.label} label={r.label} value={r.value} dir={r.ltr ? 'ltr' : undefined} />
        ))}
      </dl>
    </details>
  );
}

function Row({ label, value, dir, children }: { label: string; value: string; dir?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-300 text-right truncate max-w-[60%] flex items-center gap-2" dir={dir}>
        {value}
        {children}
      </dd>
    </div>
  );
}
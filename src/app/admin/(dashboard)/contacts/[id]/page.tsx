import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card } from '@/components/admin/Card';
import ContactStatusControl from '@/components/admin/ContactStatusControl';
import { getStore } from '@/lib/db';
import { Mail, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Contact' };

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const contact = await getStore().getContact(params.id);
  if (!contact) notFound();

  return (
    <div>
      <PageHeader
        title={contact.name}
        description={`${contact.email} · received ${new Date(contact.createdAt).toLocaleString('fa-IR')}`}
        actions={
          <a href={`mailto:${contact.email}`} className="btn-secondary flex items-center gap-2 text-sm">
            <Mail size={14} />
            Reply
          </a>
        }
      />

      <div className="space-y-4">
        <Card title="Manage">
          <ContactStatusControl contact={contact} />
        </Card>

        <Card title="Message">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{contact.message}</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Attribution">
            <dl className="space-y-2 text-sm">
              <Row label="Source" value={contact.source} />
              <Row label="Referrer" value={contact.referrer ?? '—'} />
              <Row label="Landing page" value={contact.landingPage ?? '—'} />
              <Row label="Project" value={contact.projectSlug ?? '—'} />
            </dl>
          </Card>
          <Card title="Technical">
            <dl className="space-y-2 text-sm">
              <Row label="Device" value={contact.deviceType ?? '—'} />
              <Row label="Browser" value={contact.browser ?? '—'} />
              <Row label="OS" value={contact.os ?? '—'} />
              <Row label="Processing" value={contact.processing} />
              <Row label="Spam score" value={contact.spamScore > 0 ? `${contact.spamScore}/100` : '0/100'} />
            </dl>
          </Card>
        </div>

        {contact.spamFlags.length > 0 && (
          <Card title="Spam flags">
            <div className="flex flex-wrap gap-2">
              {contact.spamFlags.map((f) => (
                <span key={f} className="px-2 py-1 text-[11px] rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                  {f}
                </span>
              ))}
            </div>
          </Card>
        )}

        <Link href="/admin/contacts" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
          <ArrowRight size={14} />
          Back to contacts
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-300 text-right truncate max-w-[60%]">{value}</dd>
    </div>
  );
}
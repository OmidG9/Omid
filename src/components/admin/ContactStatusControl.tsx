'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CONTACT_STATUS } from '@/types/contacts';
import type { ContactRequest, ContactStatus } from '@/types/contacts';

const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: 'جدید',
  READ: 'خوانده‌شده',
  REPLIED: 'پاسخ‌داده‌شده',
  ARCHIVED: 'بایگانی‌شده',
  SPAM: 'اسپم',
};

export default function ContactStatusControl({ contact }: { contact: ContactRequest }) {
  const router = useRouter();
  const [status, setStatus] = useState(contact.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: ContactStatus) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus(next);
        router.refresh();
      } else {
        setError(json.error ?? 'به‌روزرسانی ناموفق بود');
      }
    } catch {
      setError('به‌روزرسانی ناموفق بود');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-xs text-slate-500">وضعیت:</span>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {Object.values(CONTACT_STATUS).map((s) => (
          <button
            key={s}
            onClick={() => change(s as ContactStatus)}
            disabled={saving || s === status}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              s === status
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent disabled:opacity-50'
            }`}
          >
            {STATUS_LABELS[s as ContactStatus]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
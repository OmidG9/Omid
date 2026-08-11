'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save, RefreshCw } from 'lucide-react';
import type { AdminSettings } from '@/lib/settings';
import { toFaDigits } from '@/lib/utils/fa';

const FIELDS: Array<{
  key: 'rateLimitPerIp' | 'rateLimitWindowMin' | 'duplicateWindowHours' | 'spamScoreThreshold' | 'alertTrafficDropPct' | 'alertFormErrorPct' | 'alertSpamPct';
  label: string;
  hint: string;
  min: number;
  max: number;
}> = [
  { key: 'rateLimitPerIp', label: 'محدودیت نرخ (درخواست / IP)', hint: 'حداکثر درخواست هر IP در پنجره‌ی زمانی', min: 1, max: 1000 },
  { key: 'rateLimitWindowMin', label: 'پنجره‌ی محدودیت (دقیقه)', hint: 'طول پنجره‌ی نرخ', min: 1, max: 1440 },
  { key: 'duplicateWindowHours', label: 'پنجره‌ی تکراری (ساعت)', hint: 'مدت در نظر گرفتن ارسال تکراری', min: 1, max: 720 },
  { key: 'spamScoreThreshold', label: 'آستانهٔ هرزنامه (۰–۱۰۰)', hint: 'امتیاز مساوی یا بالاتر → اسپم', min: 0, max: 100 },
  { key: 'alertTrafficDropPct', label: 'هشدار افت ترافیک (٪)', hint: 'افت نسبت به دورهٔ قبل', min: 0, max: 100 },
  { key: 'alertFormErrorPct', label: 'هشدار خطای فرم (٪)', hint: 'نسبت خطا به بازدید فرم', min: 0, max: 100 },
  { key: 'alertSpamPct', label: 'هشدار نرخ اسپم (٪)', hint: 'نسبت اسپم به کل ارسال‌ها', min: 0, max: 100 },
];

const RETENTION: Array<{ key: keyof AdminSettings['retentionDays']; label: string }> = [
  { key: 'events', label: 'نگهداری رویدادها (روز)' },
  { key: 'sessions', label: 'نگهداری نشست‌ها (روز)' },
  { key: 'security', label: 'نگهداری رویدادهای امنیتی (روز)' },
];

export default function SettingsForm({ initial }: { initial: AdminSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<AdminSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initial);

  function set(key: (typeof FIELDS)[number]['key'], v: number) {
    setValues((s) => ({ ...s, [key]: v }));
  }
  function setRetention(key: keyof AdminSettings['retentionDays'], v: number) {
    setValues((s) => ({ ...s, retentionDays: { ...s.retentionDays, [key]: v } }));
  }

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('save failed');
      const json = await res.json();
      setValues(json.settings);
      setSaved(json.settings);
      toast.success('تنظیمات ذخیره شد');
      router.refresh();
    } catch {
      toast.error('ذخیرهٔ تنظیمات ناموفق بود');
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setValues(initial);
    setSaved(initial);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</span>
            <input
              type="number"
              min={f.min}
              max={f.max}
              value={values[f.key]}
              onChange={(e) => set(f.key, Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              dir="ltr"
            />
            <span className="block text-[10px] text-slate-600 mt-1">{f.hint}</span>
          </label>
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400 mb-2">نگهداری</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RETENTION.map((r) => (
            <label key={r.key} className="block">
              <span className="block text-xs font-medium text-slate-400 mb-1.5">{r.label}</span>
              <input
                type="number"
                min={1}
                max={3650}
                value={values.retentionDays[r.key]}
                onChange={(e) => setRetention(r.key, Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                dir="ltr"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={save} disabled={!dirty || saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
          ذخیرهٔ تنظیمات
        </button>
        {dirty && (
          <button onClick={reset} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} />
            بازنشانی
          </button>
        )}
        <span className="text-[11px] text-slate-600 ms-auto">
          ذخیره‌شده: {toFaDigits(new Date().toLocaleTimeString('en-GB'))}
        </span>
      </div>
    </div>
  );
}
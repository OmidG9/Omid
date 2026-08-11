'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

export default function ContactSearch({
  initial,
  filterParams,
}: {
  initial: string;
  filterParams: Record<string, string>;
}) {
  const [value, setValue] = useState(initial);
  const router = useRouter();

  function navigate(next: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filterParams)) {
      if (v) params.set(k, v);
    }
    if (next) params.set('q', next);
    router.replace(`/admin/contacts?${params.toString()}`, { scroll: false });
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(value.trim());
      }}
      className="relative"
      role="search"
    >
      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="جستجو در نام، ایمیل یا موضوع…"
        aria-label="جستجو در تماس‌ها"
        className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-9 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      {value && (
        <button
          type="button"
          aria-label="پاک کردن جستجو"
          onClick={() => {
            setValue('');
            navigate('');
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
        >
          <X size={14} />
        </button>
      )}
    </form>
  );
}
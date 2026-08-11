'use client';

/**
 * Shared error boundary for /admin (a leaf of the route tree). Ensures a store
 * outage surfaces a recovery screen instead of a blank crash (§74).
 */

import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-800/80 bg-slate-900/50 p-6 text-center">
        <TriangleAlert className="mx-auto text-amber-400" size={28} />
        <h1 className="mt-3 text-base font-semibold text-slate-100">خطا در بارگذاری صفحه</h1>
        <p className="mt-2 text-xs text-slate-500">
          داده‌ها موقتاً در دسترس نیستند. اگر مشکل ادامه داشت بعداً دوباره امتحان کنید.
        </p>
        {error.digest && (
          <p className="mt-2 text-[10px] text-slate-600" dir="ltr">
            digest: {error.digest}
          </p>
        )}
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
          >
            تلاش دوباره
          </button>
          <Link
            href="/admin"
            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    </div>
  );
}
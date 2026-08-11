import { Loader2, Inbox, TriangleAlert } from 'lucide-react';

export function LoadingState({ label = 'در حال بارگذاری…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3">
      <Loader2 size={22} className="animate-spin text-blue-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title = 'هنوز داده‌ای ثبت نشده',
  description = 'به‌محض شروع بازدید بازدیدکنندگان از سایت، داده‌ها اینجا نمایش داده می‌شوند.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="w-12 h-12 rounded-full border border-slate-700/60 bg-slate-800/40 flex items-center justify-center">
        <Inbox size={20} className="text-slate-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  message = 'در بارگذاری این بخش خطایی رخ داد.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <TriangleAlert size={22} className="text-amber-400" />
      <p className="text-sm text-slate-300 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
          تلاش مجدد
        </button>
      )}
    </div>
  );
}
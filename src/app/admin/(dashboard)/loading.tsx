/** Loading skeleton for the dashboard area (shown while server pages stream). */

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 rounded bg-slate-800/70 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-800/80 bg-slate-900/50 animate-pulse" />
        ))}
      </div>
      <div className="h-48 rounded-xl border border-slate-800/80 bg-slate-900/50 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-slate-800/80 bg-slate-900/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
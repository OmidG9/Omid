'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  FolderKanban,
  MonitorSmartphone,
  Gauge,
  Inbox,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  Ghost,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  group: string | null;
  items: NavItem[];
}

const NAV: NavSection[] = [
  { group: null, items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    group: 'Analytics',
    items: [
      { href: '/admin/analytics/overview', label: 'Overview', icon: BarChart3 },
      { href: '/admin/analytics/visitors', label: 'Visitors', icon: Users },
      { href: '/admin/analytics/pages', label: 'Pages', icon: FileText },
      { href: '/admin/analytics/traffic', label: 'Traffic', icon: TrendingUp },
      { href: '/admin/analytics/projects', label: 'Projects', icon: FolderKanban },
      { href: '/admin/analytics/devices', label: 'Devices', icon: MonitorSmartphone },
      { href: '/admin/analytics/performance', label: 'Performance', icon: Gauge },
    ],
  },
  {
    group: null,
    items: [
      { href: '/admin/contacts', label: 'Contacts', icon: Inbox },
      { href: '/admin/security', label: 'Security', icon: ShieldCheck },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === href;
  return pathname.startsWith(href);
}

export default function AdminShell({
  children,
  newRequests = 0,
}: {
  children: React.ReactNode;
  newRequests?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.replace('/admin/login');
    router.refresh();
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-slate-800/80">
        <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Ghost size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-100">GhanbariOmid</p>
            <p className="text-[11px] text-slate-500">Command Center</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((section, i) => (
          <div key={i}>
            {section.group && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                {section.group}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <item.icon size={16} className={active ? 'text-blue-400' : ''} />
                      <span className="flex-1">{item.label}</span>
                      {item.href === '/admin/contacts' && newRequests > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-[10px] font-semibold text-white flex items-center justify-center">
                          {newRequests}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800/80 bg-slate-900/40 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-14 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 flex items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-sm font-medium text-slate-300 hidden sm:block">
            {NAV.flatMap((s) => s.items)
              .find((i) => isActive(pathname, i.href))
              ?.label ?? 'Dashboard'}
          </h2>
          <div className="flex-1" />
          <span className="text-[11px] text-slate-600 hidden md:inline">
            {newRequests > 0 ? `${newRequests} new request(s)` : 'All caught up'}
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
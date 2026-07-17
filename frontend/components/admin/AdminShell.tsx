'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAdminToken } from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';
import { useAdminGuard } from '@/lib/use-admin-guard';
import { AdminThemeProvider, useAdminTheme } from '@/components/admin/AdminThemeProvider';

const NAV = [
  {
    key: 'dashboard' as const,
    label: 'Urunler',
    short: 'U',
    match: (p: string, paths: ReturnType<typeof getAdminPaths>) =>
      p === paths.dashboard || p === '/admin' || p === '/',
  },
  {
    key: 'orders' as const,
    label: 'Siparisler',
    short: 'S',
    match: (p: string) => p.includes('/orders') || p.includes('/siparisler'),
  },
  {
    key: 'settings' as const,
    label: 'Magaza',
    short: 'M',
    match: (p: string) => p.includes('/settings') || p.includes('/ayarlar'),
  },
  {
    key: 'monitoring' as const,
    label: 'Monitoring',
    short: 'I',
    match: (p: string) => p.includes('/monitoring'),
  },
];

const SIDEBAR_EXPANDED = 'w-56';
const SIDEBAR_COLLAPSED = 'w-16';

type AdminShellProps = {
  children: React.ReactNode;
};

function AdminShellInner({ children }: AdminShellProps) {
  const ready = useAdminGuard();
  const pathname = usePathname() || '';
  const router = useRouter();
  const paths = getAdminPaths();
  const isEditor = pathname.includes('/settings') || pathname.includes('/ayarlar');
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useAdminTheme();
  const dark = theme === 'dark';

  function handleLogout() {
    clearAdminToken();
    router.push(paths.login);
  }

  const shellBg = dark ? 'bg-zinc-950 text-zinc-50' : 'bg-stone-100 text-stone-900';
  const asideBg = dark
    ? 'border-zinc-800 bg-zinc-900'
    : 'border-stone-200 bg-white';
  const muted = dark ? 'text-zinc-400' : 'text-stone-500';
  const navIdle = dark
    ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900';
  const navActive = dark
    ? 'bg-amber-950/60 text-amber-100'
    : 'bg-amber-50 text-amber-950';
  const borderSoft = dark ? 'border-zinc-800' : 'border-stone-200';

  if (!ready) {
    return (
      <div className={`flex h-dvh items-center justify-center ${shellBg}`}>
        <p className={`text-sm ${muted}`}>Yonetim paneli yukleniyor...</p>
      </div>
    );
  }

  return (
    <div className={`flex h-dvh overflow-hidden ${shellBg}`} data-admin-theme={theme}>
      <aside
        className={`hidden h-full shrink-0 flex-col border-r transition-[width] duration-200 md:flex ${asideBg} ${
          sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
        }`}
      >
        <div className={`shrink-0 border-b px-3 py-4 ${borderSoft}`}>
          {sidebarCollapsed ? (
            <p className="text-center text-sm font-bold text-amber-500">HY</p>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-500">
                Yonetim
              </p>
              <p className="mt-1 truncate text-base font-semibold tracking-tight">Hatirani Yarat</p>
            </>
          )}
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          {NAV.map((item) => {
            const href = paths[item.key];
            const active = item.match(pathname, paths);
            return (
              <Link
                key={item.key}
                href={href}
                title={item.label}
                className={`rounded-lg text-sm font-medium transition ${
                  sidebarCollapsed ? 'px-0 py-2.5 text-center' : 'px-3 py-2.5'
                } ${active ? navActive : navIdle}`}
              >
                {sidebarCollapsed ? item.short : item.label}
              </Link>
            );
          })}
        </nav>

        <div className={`shrink-0 space-y-1 border-t p-2 ${borderSoft}`}>
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Menuyu genislet' : 'Menuyu daralt'}
            className={`w-full rounded-lg py-2 text-sm ${navIdle} ${
              sidebarCollapsed ? 'px-0 text-center' : 'px-3 text-left'
            }`}
          >
            {sidebarCollapsed ? '»' : '« Daralt'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            title={dark ? 'Gunduz modu' : 'Gece modu'}
            className={`w-full rounded-lg py-2 text-sm ${navIdle} ${
              sidebarCollapsed ? 'px-0 text-center' : 'px-3 text-left'
            }`}
          >
            {sidebarCollapsed ? (dark ? '☀' : '☾') : dark ? 'Gunduz modu' : 'Gece modu'}
          </button>
          <Link
            href={paths.site}
            target={paths.site.startsWith('http') ? '_blank' : undefined}
            title="Siteye git"
            className={`block rounded-lg py-2 text-sm ${navIdle} ${
              sidebarCollapsed ? 'px-0 text-center' : 'px-3'
            }`}
          >
            {sidebarCollapsed ? '↗' : 'Siteye git'}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Cikis"
            className={`w-full rounded-lg py-2 text-sm ${navIdle} ${
              sidebarCollapsed ? 'px-0 text-center' : 'px-3 text-left'
            }`}
          >
            {sidebarCollapsed ? '×' : 'Cikis'}
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 md:hidden ${asideBg} ${borderSoft}`}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-500">
              Yonetim
            </p>
            <p className="text-sm font-semibold">Hatirani Yarat</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-lg border px-3 py-1.5 text-xs ${borderSoft}`}
            >
              {dark ? 'Gunduz' : 'Gece'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className={`rounded-lg border px-3 py-1.5 text-xs ${borderSoft}`}
            >
              Cikis
            </button>
          </div>
        </header>

        <nav
          className={`flex shrink-0 gap-1 overflow-x-auto border-b px-2 py-2 md:hidden ${asideBg} ${borderSoft}`}
        >
          {NAV.map((item) => {
            const href = paths[item.key];
            const active = item.match(pathname, paths);
            return (
              <Link
                key={item.key}
                href={href}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? navActive : navIdle
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className={`min-h-0 min-w-0 flex-1 ${
            isEditor ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: AdminShellProps) {
  return (
    <AdminThemeProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminThemeProvider>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const { theme } = useAdminTheme();
  const dark = theme === 'dark';

  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1
          className={`text-2xl font-semibold tracking-tight ${
            dark ? 'text-zinc-50' : 'text-stone-900'
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p className={`mt-1 max-w-2xl text-sm ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAdminToken } from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';
import { useAdminGuard } from '@/lib/use-admin-guard';
import { AdminThemeProvider, useAdminTheme } from '@/components/admin/AdminThemeProvider';

type IconName = 'bag' | 'products' | 'orders' | 'store' | 'monitor' | 'logout' | 'site' | 'theme' | 'collapse';

function AdminIcon({ name, className = '' }: { name: IconName; className?: string }) {
  const common = `h-5 w-5 shrink-0 ${className}`;
  switch (name) {
    case 'bag':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V7a3 3 0 0 1 6 0v1" />
        </svg>
      );
    case 'products':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16v12H4z" />
          <path d="M4 7l2-3h12l2 3" />
          <path d="M10 11h4" />
        </svg>
      );
    case 'orders':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M3 4h2l2.5 11h9.5L20 8H7" />
        </svg>
      );
    case 'store':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 10h16v10H4z" />
          <path d="M4 10l2-5h12l2 5" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case 'monitor':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 19h16" />
          <path d="M6 16V9l4 4 4-6 4 5" />
        </svg>
      );
    case 'logout':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 5H5v14h5" />
          <path d="M13 12h8" />
          <path d="M18 8l4 4-4 4" />
        </svg>
      );
    case 'site':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 5h5v5" />
          <path d="M19 5l-9 9" />
          <path d="M10 5H5v14h14v-5" />
        </svg>
      );
    case 'theme':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M5 19l1.5-1.5" />
        </svg>
      );
    case 'collapse':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      );
    default:
      return null;
  }
}

const NAV = [
  {
    key: 'dashboard' as const,
    label: 'Urunler',
    icon: 'products' as const,
    match: (p: string, paths: ReturnType<typeof getAdminPaths>) =>
      p === paths.dashboard ||
      p === '/admin' ||
      p === '/' ||
      p.includes('/products') ||
      p.includes('/urunler'),
  },
  {
    key: 'orders' as const,
    label: 'Siparisler',
    icon: 'orders' as const,
    match: (p: string) => p.includes('/orders') || p.includes('/siparisler'),
  },
  {
    key: 'settings' as const,
    label: 'Magaza',
    icon: 'store' as const,
    match: (p: string) => p.includes('/settings') || p.includes('/ayarlar'),
  },
  {
    key: 'monitoring' as const,
    label: 'Izleme',
    icon: 'monitor' as const,
    match: (p: string) => p.includes('/monitoring'),
  },
];

const SIDEBAR_EXPANDED = 'w-[280px]';
const SIDEBAR_COLLAPSED = 'w-20';

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

  function handleLogout() {
    clearAdminToken();
    router.push(paths.login);
  }

  if (!ready) {
    return (
      <div
        className={`flex h-dvh items-center justify-center bg-admin-bg text-admin-muted ${
          theme === 'dark' ? 'dark' : ''
        }`}
        data-admin-theme={theme}
      >
        <p className="font-admin-mono text-sm tracking-wide">Yonetim paneli yukleniyor...</p>
      </div>
    );
  }

  return (
    <div
      className={`flex h-dvh overflow-hidden bg-admin-bg font-admin-display text-admin-text ${
        theme === 'dark' ? 'dark' : ''
      }`}
      data-admin-theme={theme}
    >
      <aside
        className={`hidden h-full shrink-0 flex-col border-r border-admin-border bg-admin-surface transition-[width] duration-200 md:flex ${
          sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
        }`}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-admin-border px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-admin-primary-container text-admin-on-primary-container">
            <AdminIcon name="bag" />
          </div>
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-admin-text">
                EticaretShop
              </p>
              <p className="font-admin-mono text-[10px] uppercase tracking-[0.2em] text-admin-muted">
                Yonetim Paneli
              </p>
            </div>
          ) : null}
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const href = paths[item.key];
            const active = item.match(pathname, paths);
            return (
              <Link
                key={item.key}
                href={href}
                title={item.label}
                className={`flex items-center gap-3 rounded-r-lg border-l-2 py-3 transition ${
                  sidebarCollapsed ? 'justify-center px-2' : 'px-4'
                } ${
                  active
                    ? 'border-admin-primary bg-admin-surface-low font-semibold text-admin-text'
                    : 'border-transparent text-admin-muted hover:bg-admin-surface-high hover:text-admin-text'
                }`}
              >
                <AdminIcon
                  name={item.icon}
                  className={active ? 'text-admin-primary' : 'text-admin-muted'}
                />
                {!sidebarCollapsed ? (
                  <span className="font-admin-mono text-sm tracking-wide">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-admin-border px-3 py-3">
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Menuyu genislet' : 'Menuyu daralt'}
            className={`flex w-full items-center gap-3 rounded-r-lg border-l-2 border-transparent py-3 text-admin-muted transition hover:bg-admin-surface-high hover:text-admin-text ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-4'
            }`}
          >
            <AdminIcon name="collapse" className={sidebarCollapsed ? 'rotate-180' : ''} />
            {!sidebarCollapsed ? (
              <span className="font-admin-mono text-sm tracking-wide">Daralt</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Gunduz modu' : 'Gece modu'}
            className={`flex w-full items-center gap-3 rounded-r-lg border-l-2 border-transparent py-3 text-admin-muted transition hover:bg-admin-surface-high hover:text-admin-text ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-4'
            }`}
          >
            <AdminIcon name="theme" />
            {!sidebarCollapsed ? (
              <span className="font-admin-mono text-sm tracking-wide">
                {theme === 'dark' ? 'Gunduz modu' : 'Gece modu'}
              </span>
            ) : null}
          </button>
          <Link
            href={paths.site}
            target={paths.site.startsWith('http') ? '_blank' : undefined}
            title="Siteye git"
            className={`flex w-full items-center gap-3 rounded-r-lg border-l-2 border-transparent py-3 text-admin-muted transition hover:bg-admin-surface-high hover:text-admin-text ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-4'
            }`}
          >
            <AdminIcon name="site" />
            {!sidebarCollapsed ? (
              <span className="font-admin-mono text-sm tracking-wide">Canli site</span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Cikis"
            className={`group flex w-full items-center gap-3 rounded-r-lg border-l-2 border-transparent py-3 text-admin-muted transition hover:border-admin-danger hover:bg-admin-surface-high hover:text-admin-danger ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-4'
            }`}
          >
            <AdminIcon name="logout" className="group-hover:text-admin-danger" />
            {!sidebarCollapsed ? (
              <span className="font-admin-mono text-sm tracking-wide">Cikis</span>
            ) : null}
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-admin-bg">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-admin-border bg-admin-surface/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-primary-container text-admin-on-primary-container">
              <AdminIcon name="bag" className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold">EticaretShop</p>
              <p className="font-admin-mono text-[10px] uppercase tracking-widest text-admin-muted">
                Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-admin-border px-3 py-1.5 font-admin-mono text-xs text-admin-muted"
          >
            Cikis
          </button>
        </header>

        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-admin-border bg-admin-surface px-2 py-2 md:hidden">
          {NAV.map((item) => {
            const href = paths[item.key];
            const active = item.match(pathname, paths);
            return (
              <Link
                key={item.key}
                href={href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-admin-mono text-sm ${
                  active
                    ? 'bg-admin-surface-low text-admin-primary'
                    : 'text-admin-muted hover:bg-admin-surface-high'
                }`}
              >
                <AdminIcon name={item.icon} className="h-4 w-4" />
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
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-admin-text">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-admin-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

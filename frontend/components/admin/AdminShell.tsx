'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAdminToken } from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';
import { useAdminGuard } from '@/lib/use-admin-guard';

const NAV = [
  { key: 'dashboard', label: 'Urunler', match: (p: string, paths: ReturnType<typeof getAdminPaths>) =>
      p === paths.dashboard || p === '/admin' || p === '/' },
  { key: 'orders', label: 'Siparisler', match: (p: string) =>
      p.includes('/orders') || p.includes('/siparisler') },
  { key: 'settings', label: 'Magaza', match: (p: string) =>
      p.includes('/settings') || p.includes('/ayarlar') },
  { key: 'monitoring', label: 'Monitoring', match: (p: string) =>
      p.includes('/monitoring') },
] as const;

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const ready = useAdminGuard();
  const pathname = usePathname() || '';
  const router = useRouter();
  const paths = getAdminPaths();
  const isEditor = pathname.includes('/settings') || pathname.includes('/ayarlar');

  function handleLogout() {
    clearAdminToken();
    router.push(paths.login);
  }

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-stone-100 dark:bg-stone-950">
        <p className="text-sm text-stone-500">Yonetim paneli yukleniyor...</p>
      </div>
    );
  }

  return (
    <div
      className={`flex bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-50 ${
        isEditor ? 'h-[100dvh] overflow-hidden' : 'min-h-full'
      }`}
    >
      <aside className="hidden w-56 shrink-0 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 md:flex">
        <div className="border-b border-stone-200 px-4 py-5 dark:border-stone-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-400">
            Yonetim
          </p>
          <p className="mt-1 text-base font-semibold tracking-tight">Hatirani Yarat</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const href = paths[item.key];
            const active = item.match(pathname, paths);
            return (
              <Link
                key={item.key}
                href={href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-amber-50 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-stone-200 p-3 dark:border-stone-800">
          <Link
            href={paths.site}
            target={paths.site.startsWith('http') ? '_blank' : undefined}
            className="block rounded-lg px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            Siteye git
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            Cikis
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900 md:hidden">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-400">
              Yonetim
            </p>
            <p className="text-sm font-semibold">Hatirani Yarat</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs dark:border-stone-700"
          >
            Cikis
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-2 py-2 dark:border-stone-800 dark:bg-stone-900 md:hidden">
          {NAV.map((item) => {
            const href = paths[item.key];
            const active = item.match(pathname, paths);
            return (
              <Link
                key={item.key}
                href={href}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-amber-50 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={`min-h-0 min-w-0 flex-1 ${isEditor ? 'overflow-hidden' : ''}`}>
          {children}
        </div>
      </div>
    </div>
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
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

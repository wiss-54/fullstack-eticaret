'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminGetStatus, getAdminToken } from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';
import type { SystemStatus } from '@/lib/types';

function formatUptime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}s ${minutes}dk`;
}

function StatusBadge({ status }: { status: 'up' | 'down' }) {
  return (
    <span
      className={
        status === 'up'
          ? 'rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-300'
          : 'rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-300'
      }
    >
      {status === 'up' ? 'Calisiyor' : 'Sorunlu'}
    </span>
  );
}

function ServiceCard({
  title,
  check,
}: {
  title: string;
  check: { status: 'up' | 'down'; latencyMs?: number; statusCode?: number; error?: string };
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{title}</h3>
        <StatusBadge status={check.status} />
      </div>
      <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        {check.latencyMs !== undefined ? <p>Gecikme: {check.latencyMs} ms</p> : null}
        {check.statusCode !== undefined ? <p>HTTP: {check.statusCode}</p> : null}
        {check.error ? <p className="text-red-600 dark:text-red-300">{check.error}</p> : null}
      </div>
    </div>
  );
}

export default function AdminMonitoringPage() {
  const router = useRouter();
  const paths = getAdminPaths();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Monitoring verisi alinamadi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace(paths.login);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminGetStatus();
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Monitoring verisi alinamadi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, paths.login]);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm font-medium text-zinc-500">Admin Panel</p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Sistem Monitoring
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={paths.dashboard}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Urunler
            </Link>
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Yenile
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-zinc-500">Monitoring verisi yukleniyor...</p>
        ) : status ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ServiceCard title="Veritabani" check={status.services.database} />
              <ServiceCard title="Backend API" check={status.services.api} />
              <ServiceCard title="Magaza Sitesi" check={status.services.shop} />
              <ServiceCard title="Admin Panel" check={status.services.adminPanel} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sunucu</h2>
                <dl className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between gap-4">
                    <dt>Hostname</dt>
                    <dd>{status.server.hostname}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Backend uptime</dt>
                    <dd>{formatUptime(status.services.backend.uptimeSeconds)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Backend bellek</dt>
                    <dd>{status.services.backend.memoryMb} MB</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Serbest RAM</dt>
                    <dd>
                      {status.server.freeMemoryMb} / {status.server.totalMemoryMb} MB
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Urun sayisi</dt>
                    <dd>{status.stats.productCount ?? '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Son kontrol</dt>
                    <dd>{new Date(status.checkedAt).toLocaleString('tr-TR')}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Deploy & CI</h2>
                <dl className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between gap-4">
                    <dt>Son commit</dt>
                    <dd>{status.deploy?.commit ?? 'Bilinmiyor'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Deploy zamani</dt>
                    <dd>
                      {status.deploy?.deployedAt
                        ? new Date(status.deploy.deployedAt).toLocaleString('tr-TR')
                        : 'Bilinmiyor'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={status.links.githubActions}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    GitHub Actions
                  </a>
                  <a
                    href={status.links.codecov}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Codecov Raporu
                  </a>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminAuthError, adminGetStatus } from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';
import { useAdminGuard } from '@/lib/use-admin-guard';
import type { ServiceCheck, SystemStatus } from '@/lib/types';

const REFRESH_MS = 15_000;

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}g ${hours}s ${minutes}dk`;
  return `${hours}s ${minutes}dk`;
}

function formatAgo(date: Date) {
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 5) return 'az once';
  if (diff < 60) return `${diff} sn once`;
  return `${Math.floor(diff / 60)} dk once`;
}

function latencyTone(ms?: number) {
  if (ms === undefined) return 'bg-zinc-400';
  if (ms < 200) return 'bg-emerald-500';
  if (ms < 500) return 'bg-amber-500';
  return 'bg-red-500';
}

function latencyPercent(ms?: number) {
  if (ms === undefined) return 0;
  return Math.min(100, Math.round((ms / 800) * 100));
}

function memoryUsedPercent(freeMb: number, totalMb: number) {
  if (totalMb <= 0) return 0;
  return Math.round(((totalMb - freeMb) / totalMb) * 100);
}

function countHealthy(status: SystemStatus) {
  const checks = [
    status.services.database,
    status.services.api,
    status.services.shop,
    status.services.adminPanel,
    status.services.backend,
  ];
  return checks.filter((check) => check.status === 'up').length;
}

function ServiceIcon({ title }: { title: string }) {
  const icon =
    title === 'Veritabani'
      ? '🗄️'
      : title === 'Backend API'
        ? '⚡'
        : title === 'Magaza Sitesi'
          ? '🛍️'
          : title === 'Admin Panel'
            ? '🛡️'
            : '🖥️';

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900/5 text-2xl dark:bg-white/10">
      {icon}
    </div>
  );
}

function ServiceCard({
  title,
  check,
}: {
  title: string;
  check: ServiceCheck & { status: 'up' | 'down' };
}) {
  const up = check.status === 'up';

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm transition ${
        up
          ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-zinc-950'
          : 'border-red-200/80 bg-gradient-to-br from-red-50 to-white dark:border-red-900/40 dark:from-red-950/30 dark:to-zinc-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ServiceIcon title={title} />
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
            <p className="text-sm text-zinc-500">{up ? 'Erisilebilir' : 'Sorun tespit edildi'}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            up
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {up ? 'UP' : 'DOWN'}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Gecikme</span>
            <span>{check.latencyMs !== undefined ? `${check.latencyMs} ms` : '-'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${latencyTone(check.latencyMs)}`}
              style={{ width: `${latencyPercent(check.latencyMs)}%` }}
            />
          </div>
        </div>
        {check.statusCode !== undefined ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">HTTP {check.statusCode}</p>
        ) : null}
        {check.error ? <p className="text-sm text-red-600 dark:text-red-300">{check.error}</p> : null}
      </div>
    </article>
  );
}

function MetricBar({
  label,
  value,
  percent,
  tone = 'bg-amber-500',
}: {
  label: string;
  value: string;
  percent: number;
  tone?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

export default function MonitoringDashboard() {
  const router = useRouter();
  const paths = getAdminPaths();
  const ready = useAdminGuard();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const health = useMemo(() => {
    if (!status) return null;
    const healthy = countHealthy(status);
    const total = 5;
    if (healthy === total) return { label: 'Tum sistemler calisiyor', tone: 'emerald' as const };
    if (healthy >= 3) return { label: 'Kismi sorun var', tone: 'amber' as const };
    return { label: 'Kritik sorun', tone: 'red' as const };
  }, [status]);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function fetchStatus(initial = false) {
      if (initial) setLoading(true);
      else setRefreshing(true);

      try {
        const data = await adminGetStatus();
        if (cancelled) return;
        setStatus(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          router.replace(paths.login);
          return;
        }
        setError(err instanceof Error ? err.message : 'Monitoring verisi alinamadi');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void fetchStatus(true);

    if (!autoRefresh) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void fetchStatus(false);
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [ready, autoRefresh, router, paths.login]);

  useEffect(() => {
    if (!lastUpdated) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [lastUpdated]);

  async function handleManualRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const data = await adminGetStatus();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.replace(paths.login);
        return;
      }
      setError(err instanceof Error ? err.message : 'Monitoring verisi alinamadi');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  const ramUsedPercent = status
    ? memoryUsedPercent(status.server.freeMemoryMb, status.server.totalMemoryMb)
    : 0;

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_35%),linear-gradient(180deg,#fafafa_0%,#f4f4f5_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_transparent_35%),linear-gradient(180deg,#09090b_0%,#000_100%)]">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Admin Panel</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Canli Monitoring
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Servisler her {REFRESH_MS / 1000} saniyede otomatik yenilenir
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
              />
              Otomatik yenile
            </label>
            <Link
              href={paths.dashboard}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Urunler
            </Link>
            <Link
              href={paths.orders}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Siparisler
            </Link>
            <Link
              href={paths.settings}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Magaza
            </Link>
            <button
              type="button"
              onClick={() => void handleManualRefresh()}
              disabled={refreshing}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {refreshing ? 'Yenileniyor...' : 'Simdi Yenile'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {!ready || loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-3xl border border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/70"
              />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/40">
            <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Oturum suresi dolmus olabilir. Tekrar giris yapmayi dene.
            </p>
            <Link
              href={paths.login}
              className="mt-3 inline-block rounded-xl bg-red-800 px-4 py-2 text-sm text-white"
            >
              Giris Sayfasina Git
            </Link>
          </div>
        ) : null}

        {status && health ? (
          <>
            <section
              className={`rounded-3xl border p-6 shadow-sm ${
                health.tone === 'emerald'
                  ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-white dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-zinc-950'
                  : health.tone === 'amber'
                    ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-white dark:border-amber-900/40 dark:from-amber-950/20 dark:to-zinc-950'
                    : 'border-red-200 bg-gradient-to-r from-red-50 to-white dark:border-red-900/40 dark:from-red-950/20 dark:to-zinc-950'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-900">
                    <span
                      className={`absolute inline-flex h-4 w-4 animate-ping rounded-full opacity-40 ${
                        autoRefresh ? 'bg-emerald-500' : 'bg-zinc-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex h-4 w-4 rounded-full ${
                        autoRefresh ? 'bg-emerald-500' : 'bg-zinc-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Genel Durum
                    </p>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{health.label}</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {countHealthy(status)}/5 servis saglikli
                      {lastUpdated ? ` · Son guncelleme ${formatAgo(lastUpdated)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-center dark:bg-zinc-900/80">
                    <p className="text-xs text-zinc-500">Urun</p>
                    <p className="text-xl font-bold">{status.stats.productCount ?? '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-center dark:bg-zinc-900/80">
                    <p className="text-xs text-zinc-500">Uptime</p>
                    <p className="text-sm font-bold">
                      {formatUptime(status.services.backend.uptimeSeconds)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-center dark:bg-zinc-900/80">
                    <p className="text-xs text-zinc-500">RAM</p>
                    <p className="text-sm font-bold">{ramUsedPercent}% kullanim</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-center dark:bg-zinc-900/80">
                    <p className="text-xs text-zinc-500">Commit</p>
                    <p className="text-sm font-bold">{status.deploy?.commit?.slice(0, 7) ?? '-'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ServiceCard title="Veritabani" check={status.services.database} />
              <ServiceCard title="Backend API" check={status.services.api} />
              <ServiceCard title="Magaza Sitesi" check={status.services.shop} />
              <ServiceCard title="Admin Panel" check={status.services.adminPanel} />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sunucu Metrikleri</h3>
                <div className="mt-5 space-y-5">
                  <MetricBar
                    label="RAM kullanimi"
                    value={`${status.server.totalMemoryMb - status.server.freeMemoryMb} / ${status.server.totalMemoryMb} MB`}
                    percent={ramUsedPercent}
                    tone={ramUsedPercent > 85 ? 'bg-red-500' : ramUsedPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}
                  />
                  <MetricBar
                    label="Backend bellek"
                    value={`${status.services.backend.memoryMb} MB`}
                    percent={Math.min(100, Math.round((status.services.backend.memoryMb / 512) * 100))}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <p className="text-sm text-zinc-500">Hostname</p>
                      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                        {status.server.hostname}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <p className="text-sm text-zinc-500">Load average</p>
                      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                        {status.server.loadAverage.join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Deploy & CI</h3>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-zinc-500">Son commit</dt>
                    <dd className="mt-1 font-mono text-zinc-900 dark:text-zinc-50">
                      {status.deploy?.commit ?? 'Bilinmiyor'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Deploy zamani</dt>
                    <dd className="mt-1 text-zinc-900 dark:text-zinc-50">
                      {status.deploy?.deployedAt
                        ? new Date(status.deploy.deployedAt).toLocaleString('tr-TR')
                        : 'Bilinmiyor'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Son kontrol</dt>
                    <dd className="mt-1 text-zinc-900 dark:text-zinc-50">
                      {new Date(status.checkedAt).toLocaleString('tr-TR')}
                    </dd>
                  </div>
                </dl>
                <a
                  href={status.links.githubActions}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                >
                  GitHub Actions
                </a>
              </div>
            </section>
          </>
        ) : null}
      </main>
      <span className="sr-only" aria-hidden>
        {tick}
      </span>
    </div>
  );
}

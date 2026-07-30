'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublicStatus } from '@/lib/api';
import type { PublicStatusPayload } from '@/lib/types';

function overallLabel(overall: PublicStatusPayload['overall']) {
  if (overall === 'operational') return 'Tum sistemler calisiyor';
  if (overall === 'partial') return 'Kismi kesinti';
  return 'Buyuk kesinti';
}

function overallTone(overall: PublicStatusPayload['overall']) {
  if (overall === 'operational') return 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30';
  if (overall === 'partial') return 'bg-amber-500/15 text-amber-900 border-amber-500/30';
  return 'bg-red-500/15 text-red-800 border-red-500/30';
}

function ciLabel(status: string) {
  if (status === 'success') return 'CI basarili';
  if (status === 'failure') return 'CI basarisiz';
  if (status === 'pending') return 'CI devam ediyor';
  if (status === 'cancelled') return 'CI iptal';
  return 'CI bilinmiyor';
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return '-';
  if (seconds < 60) return `${seconds} sn`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes < 60) return `${minutes} dk ${rem} sn`;
  const hours = Math.floor(minutes / 60);
  return `${hours} sa ${minutes % 60} dk`;
}

export default function PublicStatusClient() {
  const [data, setData] = useState<PublicStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (refresh = false) => {
    try {
      setError(null);
      const next = await getPublicStatus(refresh);
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durum yuklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const id = window.setInterval(() => void load(false), 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-store-muted">
            EticaretShop
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-store-display,ui-serif)] text-4xl font-semibold tracking-tight text-store-text md:text-5xl">
            Sistem durumu
          </h1>
          <p className="mt-2 text-store-muted">
            Magaza, API, veritabani ve admin paneli canli saglik ozeti
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          className="rounded-lg border border-store-border bg-store-surface-low px-4 py-2 text-sm font-medium text-store-text transition hover:border-store-primary"
        >
          Yenile
        </button>
      </div>

      {loading && !data ? (
        <div className="h-40 animate-pulse rounded-2xl bg-store-surface-low" />
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="space-y-6">
          <section
            className={`rounded-2xl border px-5 py-5 ${overallTone(data.overall)}`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em]">Genel durum</p>
            <p className="mt-2 text-2xl font-bold">{overallLabel(data.overall)}</p>
            <p className="mt-2 text-sm opacity-80">
              Son kontrol: {new Date(data.checkedAt).toLocaleString('tr-TR')}
            </p>
          </section>

          <section className="overflow-hidden rounded-2xl border border-store-border bg-store-surface-low">
            <div className="border-b border-store-border px-5 py-4">
              <h2 className="text-lg font-semibold text-store-text">Servisler</h2>
            </div>
            <ul className="divide-y divide-store-border">
              {data.services.map((service) => (
                <li
                  key={service.key}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-store-text">{service.label}</p>
                    {service.latencyMs != null ? (
                      <p className="text-sm text-store-muted">{service.latencyMs} ms</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      service.status === 'up'
                        ? 'bg-emerald-500/15 text-emerald-700'
                        : 'bg-red-500/15 text-red-700'
                    }`}
                  >
                    {service.status === 'up' ? '● UP' : '● DOWN'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-store-border bg-store-surface-low p-5">
              <h2 className="text-lg font-semibold text-store-text">CI / CD</h2>
              <p className="mt-3 text-2xl font-bold text-store-text">{ciLabel(data.ci.status)}</p>
              <p className="mt-2 text-sm text-store-muted">
                {data.ci.workflowName || 'ci.yml'} · {data.ci.branch || 'main'}
                {data.ci.commitSha ? ` · ${data.ci.commitSha}` : ''}
              </p>
              {data.ci.badgeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.ci.badgeUrl} alt="CI badge" className="mt-4 h-5" />
              ) : null}
              {data.ci.htmlUrl ? (
                <a
                  href={data.ci.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm font-medium text-store-primary underline-offset-2 hover:underline"
                >
                  GitHub Actions
                </a>
              ) : null}
            </article>

            <article className="rounded-2xl border border-store-border bg-store-surface-low p-5">
              <h2 className="text-lg font-semibold text-store-text">Deploy</h2>
              <p className="mt-3 font-mono text-2xl font-bold text-store-text">
                {data.deploy?.commit || '-'}
              </p>
              <p className="mt-2 text-sm text-store-muted">
                {data.deploy?.deployedAt
                  ? new Date(data.deploy.deployedAt).toLocaleString('tr-TR')
                  : 'Deploy bilgisi yok'}
              </p>
            </article>
          </section>

          <section className="rounded-2xl border border-store-border bg-store-surface-low p-5">
            <h2 className="text-lg font-semibold text-store-text">Acik olaylar</h2>
            {data.incidents.openCount === 0 ? (
              <p className="mt-3 text-sm text-store-muted">Su an acik incident yok.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.incidents.open.map((item) => (
                  <li key={item.id} className="rounded-xl bg-store-bg px-4 py-3">
                    <p className="font-medium text-store-text">{item.label}</p>
                    <p className="text-sm text-store-muted">{item.message}</p>
                    <p className="mt-1 text-xs text-store-muted">
                      Baslangic: {new Date(item.startedAt).toLocaleString('tr-TR')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {data.incidents.lastResolved ? (
              <p className="mt-4 text-sm text-store-muted">
                Son cozulen: {data.incidents.lastResolved.label} ·{' '}
                {formatDuration(data.incidents.lastResolved.durationSeconds)}
              </p>
            ) : null}
          </section>

          <p className="text-center text-sm text-store-muted">
            <Link href="/" className="font-medium text-store-primary hover:underline">
              Magazaya don
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminAuthError,
  adminGetStatusCheck,
  adminGetStatusMeta,
} from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';
import { useAdminGuard } from '@/lib/use-admin-guard';
import type {
  BackupStatus,
  ServiceCheck,
  SystemStatusCheckName,
  SystemStatusMeta,
} from '@/lib/types';
import {
  appendUptimeHistoryPoint,
  emptyScores,
  readUptimeHistory,
  type UptimeHistoryPoint,
  type UptimeHistoryScores,
} from '@/lib/uptime-history';

const REFRESH_MS = 30_000;
const UPTIME_ATTEMPTS = 10;

const SERVICE_CHECKS: Array<{ key: SystemStatusCheckName; title: string }> = [
  { key: 'database', title: 'Veritabani' },
  { key: 'api', title: 'Backend API' },
  { key: 'shop', title: 'Magaza Sitesi' },
  { key: 'adminPanel', title: 'Admin Panel' },
];

const PROGRESS_TOTAL = 1 + SERVICE_CHECKS.length;

type ProgressKey = 'meta' | SystemStatusCheckName;

type UptimeTargetKey = 'backend' | SystemStatusCheckName;

const UPTIME_TARGETS: Array<{
  key: UptimeTargetKey;
  title: string;
  subtitle: string;
}> = [
  { key: 'backend', title: 'Backend', subtitle: 'Meta / API yaniti' },
  { key: 'database', title: 'Veritabani', subtitle: 'Postgres SELECT 1' },
  { key: 'api', title: 'Backend API', subtitle: 'MONITOR_API_URL' },
  { key: 'shop', title: 'Magaza Sitesi', subtitle: 'MONITOR_SHOP_URL' },
  { key: 'adminPanel', title: 'Admin Panel', subtitle: 'MONITOR_ADMIN_URL' },
];

type UptimeProbeState = {
  index: number;
  ok: boolean | null;
};

type UptimeBoard = Record<UptimeTargetKey, UptimeProbeState[]>;

function emptyUptimeBoard(): UptimeBoard {
  return {
    backend: Array.from({ length: UPTIME_ATTEMPTS }, (_, index) => ({
      index: index + 1,
      ok: null,
    })),
    database: Array.from({ length: UPTIME_ATTEMPTS }, (_, index) => ({
      index: index + 1,
      ok: null,
    })),
    api: Array.from({ length: UPTIME_ATTEMPTS }, (_, index) => ({
      index: index + 1,
      ok: null,
    })),
    shop: Array.from({ length: UPTIME_ATTEMPTS }, (_, index) => ({
      index: index + 1,
      ok: null,
    })),
    adminPanel: Array.from({ length: UPTIME_ATTEMPTS }, (_, index) => ({
      index: index + 1,
      ok: null,
    })),
  };
}

function summarizeProbes(probes: UptimeProbeState[]) {
  const done = probes.filter((probe) => probe.ok !== null).length;
  const success = probes.filter((probe) => probe.ok === true).length;
  return {
    done,
    success,
    percent: Math.round((success / UPTIME_ATTEMPTS) * 100),
    progressPercent: Math.round((done / UPTIME_ATTEMPTS) * 100),
    complete: done >= UPTIME_ATTEMPTS,
  };
}

function buildCumulativeHeights(probes: UptimeProbeState[], livePercent: number) {
  const columns: Array<{ height: number; pending: boolean; ok: boolean | null }> = [];
  let successSoFar = 0;

  for (const probe of probes) {
    if (probe.ok === null) {
      columns.push({ height: livePercent, pending: true, ok: null });
      continue;
    }
    if (probe.ok) successSoFar += 1;
    columns.push({
      height: Math.round((successSoFar / UPTIME_ATTEMPTS) * 100),
      pending: false,
      ok: probe.ok,
    });
  }

  return columns;
}

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
  if (ms === undefined) return 'bg-admin-muted';
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
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-admin-surface-high text-xl">
      {icon}
    </div>
  );
}

function ServiceCard({
  title,
  check,
  pending,
}: {
  title: string;
  check?: ServiceCheck;
  pending?: boolean;
}) {
  if (pending || !check) {
    return (
      <article className="relative overflow-hidden rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ServiceIcon title={title} />
            <div>
              <h3 className="font-semibold text-admin-text">{title}</h3>
              <p className="text-sm text-admin-muted">Yanit bekleniyor...</p>
            </div>
          </div>
          <span className="rounded-full bg-admin-bg px-3 py-1 font-admin-mono text-xs font-semibold text-admin-muted">
            ...
          </span>
        </div>
        <div className="mt-5 h-2 animate-pulse rounded-full bg-admin-bg" />
      </article>
    );
  }

  const up = check.status === 'up';

  return (
    <article
      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition ${
        up
          ? 'border-emerald-500/30 bg-admin-surface-low'
          : 'border-admin-danger/40 bg-admin-surface-low'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ServiceIcon title={title} />
          <div>
            <h3 className="font-semibold text-admin-text">{title}</h3>
            <p className="text-sm text-admin-muted">{up ? 'Erisilebilir' : 'Sorun tespit edildi'}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 font-admin-mono text-xs font-semibold ${
            up
              ? 'bg-emerald-500/15 text-emerald-700'
              : 'bg-admin-danger/15 text-admin-danger'
          }`}
        >
          {up ? 'UP' : 'DOWN'}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between font-admin-mono text-xs text-admin-muted">
            <span>Gecikme</span>
            <span>{check.latencyMs !== undefined ? `${check.latencyMs} ms` : '-'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-admin-bg">
            <div
              className={`h-full rounded-full transition-all duration-500 ${latencyTone(check.latencyMs)}`}
              style={{ width: `${latencyPercent(check.latencyMs)}%` }}
            />
          </div>
        </div>
        {check.statusCode !== undefined ? (
          <p className="text-sm text-admin-muted">HTTP {check.statusCode}</p>
        ) : null}
        {check.error ? <p className="text-sm text-admin-danger">{check.error}</p> : null}
      </div>
    </article>
  );
}

function backupTone(status: BackupStatus['status']) {
  if (status === 'ok') {
    return {
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/15 text-emerald-700',
      label: 'GUNCEL',
    };
  }
  if (status === 'stale') {
    return {
      border: 'border-admin-primary/40',
      badge: 'bg-admin-primary/15 text-admin-primary',
      label: 'ESKI',
    };
  }
  return {
    border: 'border-admin-danger/40',
    badge: 'bg-admin-danger/15 text-admin-danger',
    label: status === 'error' ? 'HATA' : 'YOK',
  };
}

function BackupCard({ backup }: { backup: BackupStatus }) {
  const tone = backupTone(backup.status);

  return (
    <article className={`rounded-xl border bg-admin-surface-low p-6 shadow-sm ${tone.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-admin-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-admin-muted">
            Yedekleme
          </p>
          <h3 className="mt-1 text-lg font-semibold text-admin-text">Gunluk Backup</h3>
          <p className="mt-1 text-sm text-admin-muted">
            Postgres + uploads · {backup.retentionDays} gun saklama
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 font-admin-mono text-xs font-semibold ${tone.badge}`}>
          {tone.label}
        </span>
      </div>

      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="text-admin-muted">Son yedek</dt>
          <dd className="mt-1 font-medium text-admin-text">
            {backup.latest
              ? new Date(backup.latest.createdAt).toLocaleString('tr-TR')
              : 'Henuz yedek yok'}
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-admin-border bg-admin-bg p-3">
            <p className="text-xs text-admin-muted">Boyut</p>
            <p className="mt-1 font-semibold text-admin-text">
              {backup.latest ? `${backup.latest.sizeMb} MB` : '-'}
            </p>
          </div>
          <div className="rounded-lg border border-admin-border bg-admin-bg p-3">
            <p className="text-xs text-admin-muted">Dosya sayisi</p>
            <p className="mt-1 font-semibold text-admin-text">{backup.count}</p>
          </div>
        </div>
        {backup.latest ? (
          <div>
            <dt className="text-admin-muted">Dosya</dt>
            <dd className="mt-1 break-all font-admin-mono text-xs text-admin-text">
              {backup.latest.fileName}
            </dd>
            <p className="mt-1 text-xs text-admin-muted">
              {backup.latest.ageHours != null ? `${backup.latest.ageHours} saat once` : ''}
            </p>
          </div>
        ) : null}
        {backup.error ? <p className="text-sm text-admin-danger">{backup.error}</p> : null}
      </dl>

      {backup.recent.length > 1 ? (
        <ul className="mt-5 space-y-2 border-t border-admin-border pt-4">
          {backup.recent.slice(0, 3).map((file) => (
            <li
              key={file.fileName}
              className="flex items-center justify-between gap-2 text-xs text-admin-muted"
            >
              <span className="truncate font-admin-mono">{file.fileName}</span>
              <span className="shrink-0">{file.sizeMb} MB</span>
            </li>
          ))}
        </ul>
      ) : null}
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
        <span className="text-admin-muted">{label}</span>
        <span className="font-medium text-admin-text">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-admin-bg">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

function UptimeAxisCard({
  title,
  subtitle,
  probes,
}: {
  title: string;
  subtitle: string;
  probes: UptimeProbeState[];
}) {
  const summary = summarizeProbes(probes);
  const livePercent = summary.percent;
  const barTone = !summary.complete
    ? 'bg-admin-primary'
    : livePercent >= 90
      ? 'bg-emerald-500'
      : livePercent >= 70
        ? 'bg-amber-500'
        : 'bg-red-500';

  const cumulativeHeights = buildCumulativeHeights(probes, livePercent);

  return (
    <article className="rounded-xl border border-admin-border bg-admin-surface-low p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-admin-text">{title}</h3>
          <p className="mt-0.5 text-xs text-admin-muted">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-admin-mono text-2xl font-bold tabular-nums text-admin-text transition-all">
            %{livePercent}
          </p>
          <p className="font-admin-mono text-[11px] text-admin-muted">
            {summary.success}/{UPTIME_ATTEMPTS}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex h-40 w-8 flex-col justify-between font-admin-mono text-[10px] text-admin-muted">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>

        <div className="relative min-w-0 flex-1">
          <p className="pointer-events-none absolute -left-1 -top-5 text-[10px] font-semibold text-admin-muted">
            Y %
          </p>
          <div className="relative flex h-40 items-end gap-1 border-b border-l border-admin-border bg-[linear-gradient(to_top,transparent_0,transparent_calc(25%-1px),rgba(0,0,0,0.04)_calc(25%-1px),rgba(0,0,0,0.04)_25%,transparent_25%,transparent_calc(50%-1px),rgba(0,0,0,0.04)_calc(50%-1px),rgba(0,0,0,0.04)_50%,transparent_50%,transparent_calc(75%-1px),rgba(0,0,0,0.04)_calc(75%-1px),rgba(0,0,0,0.04)_75%,transparent_75%)] px-1 pb-0 pt-1">
            {/* Canli Y dolgusu — toplam skor yukari cikar */}
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 opacity-20 transition-all duration-500 ${barTone}`}
              style={{ height: `${Math.max(livePercent, summary.done > 0 ? 4 : 0)}%` }}
            />

            {cumulativeHeights.map((column, index) => {
              const probe = probes[index];
              const height =
                probe.ok === null
                  ? Math.max(livePercent * 0.15, summary.done > 0 ? 4 : 2)
                  : Math.max(column.height, probe.ok ? 8 : 6);

              return (
                <div
                  key={probe.index}
                  className="relative z-[1] flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  title={`#${probe.index}: ${
                    probe.ok === null ? 'bekleniyor' : probe.ok ? 'dondu' : 'donmedi'
                  }`}
                >
                  <div
                    className={`w-full max-w-[18px] rounded-t-sm transition-all duration-500 ease-out ${
                      probe.ok === null
                        ? 'animate-pulse bg-admin-muted/50'
                        : probe.ok
                          ? barTone
                          : 'bg-admin-danger'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between font-admin-mono text-[10px] text-admin-muted">
            <span>X: 1</span>
            <span>istek</span>
            <span>{UPTIME_ATTEMPTS}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-admin-muted">
        {summary.complete
          ? `${summary.success}/${UPTIME_ATTEMPTS} istek dondu · skor %${livePercent}`
          : `${summary.done}/${UPTIME_ATTEMPTS} denendi · ${summary.success} dondu · canli %${livePercent}`}
      </p>
    </article>
  );
}

const UPTIME_SERIES: Array<{ key: UptimeTargetKey; label: string; color: string }> = [
  { key: 'backend', label: 'backend', color: '#3b82f6' },
  { key: 'database', label: 'database', color: '#14b8a6' },
  { key: 'api', label: 'api', color: '#a855f7' },
  { key: 'shop', label: 'shop', color: '#f43f5e' },
  { key: 'adminPanel', label: 'admin', color: '#f59e0b' },
];

function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function UptimeHourChart({ points }: { points: UptimeHistoryPoint[] }) {
  const width = 920;
  const height = 260;
  const pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const now = Date.now();
  const start = now - 60 * 60 * 1000;

  const xFor = (at: number) =>
    pad.left + ((Math.max(start, Math.min(now, at)) - start) / (60 * 60 * 1000)) * innerW;
  const yFor = (percent: number) => pad.top + ((100 - percent) / 100) * innerH;

  const ticks = [0, 25, 50, 75, 100];
  const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => start + ratio * 60 * 60 * 1000);

  function pathFor(key: UptimeTargetKey) {
    if (points.length === 0) return '';
    return points
      .map((point, index) => {
        const x = xFor(point.at);
        const y = yFor(point.scores[key] ?? 0);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const overallPath =
    points.length === 0
      ? ''
      : points
          .map((point, index) => {
            const x = xFor(point.at);
            const y = yFor(point.overall);
            return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(' ');

  return (
    <section className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-admin-text">Resource Health · Uptime</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Son 1 saat · her {REFRESH_MS / 1000} sn olcum · Y: basari % · X: zaman
          </p>
        </div>
        <span className="rounded-lg border border-admin-border bg-admin-bg px-3 py-1.5 text-sm text-admin-text">
          1 hour
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full min-w-[640px]">
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="currentColor"
                className="text-admin-border"
                strokeWidth="1"
              />
              <text
                x={pad.left - 8}
                y={yFor(tick) + 3}
                textAnchor="end"
                className="fill-admin-muted font-admin-mono text-[10px]"
              >
                {tick}%
              </text>
            </g>
          ))}

          {timeTicks.map((ts) => (
            <text
              key={ts}
              x={xFor(ts)}
              y={height - 8}
              textAnchor="middle"
              className="fill-admin-muted font-admin-mono text-[10px]"
            >
              {formatClock(ts)}
            </text>
          ))}

          {UPTIME_SERIES.map((series) => (
            <path
              key={series.key}
              d={pathFor(series.key)}
              fill="none"
              stroke={series.color}
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {overallPath ? (
            <path
              d={overallPath}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.8"
              strokeDasharray="5 4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {points.length === 0 ? (
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              className="fill-admin-muted text-sm"
            >
              Olcumler birikiyor… 30 sn sonra grafik dolacak
            </text>
          ) : null}
        </svg>
      </div>

      <ul className="mt-3 flex flex-wrap gap-3">
        <li className="inline-flex items-center gap-2 text-xs text-admin-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          overall
        </li>
        {UPTIME_SERIES.map((series) => (
          <li key={series.key} className="inline-flex items-center gap-2 text-xs text-admin-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MonitoringDashboard() {
  const router = useRouter();
  const paths = getAdminPaths();
  const ready = useAdminGuard();
  const [meta, setMeta] = useState<SystemStatusMeta | null>(null);
  const [checks, setChecks] = useState<Partial<Record<SystemStatusCheckName, ServiceCheck>>>({});
  const [settled, setSettled] = useState<Partial<Record<ProgressKey, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uptimeBoard, setUptimeBoard] = useState<UptimeBoard>(() => emptyUptimeBoard());
  const [uptimeRunning, setUptimeRunning] = useState(false);
  const [uptimeHistory, setUptimeHistory] = useState<UptimeHistoryPoint[]>([]);

  useEffect(() => {
    setUptimeHistory(readUptimeHistory());
  }, []);

  const completedCount = useMemo(
    () => Object.values(settled).filter(Boolean).length,
    [settled],
  );
  const progressPercent = Math.round((completedCount / PROGRESS_TOTAL) * 100);
  const allSettled = completedCount >= PROGRESS_TOTAL;

  const healthyCount = useMemo(() => {
    let count = 0;
    if (meta?.backend.status === 'up') count += 1;
    for (const item of SERVICE_CHECKS) {
      if (checks[item.key]?.status === 'up') count += 1;
    }
    return count;
  }, [meta, checks]);

  const uptimeTotals = useMemo(() => {
    let done = 0;
    let success = 0;
    for (const target of UPTIME_TARGETS) {
      const summary = summarizeProbes(uptimeBoard[target.key]);
      done += summary.done;
      success += summary.success;
    }
    const total = UPTIME_TARGETS.length * UPTIME_ATTEMPTS;
    return {
      done,
      success,
      total,
      percent: Math.round((success / total) * 100),
      progressPercent: Math.round((done / total) * 100),
      complete: done >= total,
    };
  }, [uptimeBoard]);

  const health = useMemo(() => {
    if (uptimeRunning || !uptimeTotals.complete) {
      return { label: 'Uptime olcumu suruyor', tone: 'amber' as const };
    }
    if (uptimeTotals.percent >= 90) {
      return { label: 'Uptime skoru yuksek', tone: 'emerald' as const };
    }
    if (uptimeTotals.percent >= 70) {
      return { label: 'Uptime skoru orta', tone: 'amber' as const };
    }
    return { label: 'Uptime skoru dusuk', tone: 'red' as const };
  }, [uptimeRunning, uptimeTotals]);

  const markSettled = useCallback((key: ProgressKey) => {
    setSettled((current) => ({ ...current, [key]: true }));
  }, []);

  const setProbeResult = useCallback(
    (target: UptimeTargetKey, index: number, ok: boolean) => {
      setUptimeBoard((current) => ({
        ...current,
        [target]: current[target].map((probe) =>
          probe.index === index ? { ...probe, ok } : probe,
        ),
      }));
    },
    [],
  );

  const runUptimeProbes = useCallback(
    async (handleAuth: (err: unknown) => boolean) => {
      setUptimeRunning(true);
      setUptimeBoard(emptyUptimeBoard());

      const tallies: Record<UptimeTargetKey, { success: number; done: number }> = {
        backend: { success: 0, done: 0 },
        database: { success: 0, done: 0 },
        api: { success: 0, done: 0 },
        shop: { success: 0, done: 0 },
        adminPanel: { success: 0, done: 0 },
      };

      await Promise.all(
        UPTIME_TARGETS.map(async (target) => {
          await Promise.all(
            Array.from({ length: UPTIME_ATTEMPTS }, async (_, index) => {
              const probeIndex = index + 1;
              let ok = false;
              try {
                if (target.key === 'backend') {
                  await adminGetStatusMeta();
                  ok = true;
                } else {
                  const data = await adminGetStatusCheck(target.key);
                  ok = data.check.status === 'up';
                }
              } catch (err) {
                if (handleAuth(err)) return;
                ok = false;
              }
              tallies[target.key].done += 1;
              if (ok) tallies[target.key].success += 1;
              setProbeResult(target.key, probeIndex, ok);
            }),
          );
        }),
      );

      const scores: UptimeHistoryScores = emptyScores();
      let successTotal = 0;
      for (const target of UPTIME_TARGETS) {
        const { success } = tallies[target.key];
        scores[target.key] = Math.round((success / UPTIME_ATTEMPTS) * 100);
        successTotal += success;
      }
      const overall = Math.round(
        (successTotal / (UPTIME_TARGETS.length * UPTIME_ATTEMPTS)) * 100,
      );
      setUptimeHistory(appendUptimeHistoryPoint(scores, overall));
      setUptimeRunning(false);
    },
    [setProbeResult],
  );

  const runProgressiveFetch = useCallback(
    async (initial: boolean) => {
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError(null);
      setSettled({});
      setChecks({});

      const handleAuth = (err: unknown) => {
        if (err instanceof AdminAuthError) {
          router.replace(paths.login);
          return true;
        }
        return false;
      };

      const tasks: Array<Promise<void>> = [
        runUptimeProbes(handleAuth),
        adminGetStatusMeta()
          .then((data) => {
            setMeta(data);
            markSettled('meta');
          })
          .catch((err) => {
            markSettled('meta');
            if (handleAuth(err)) return;
            setError(err instanceof Error ? err.message : 'Monitoring meta alinamadi');
          }),
        ...SERVICE_CHECKS.map(({ key }) =>
          adminGetStatusCheck(key)
            .then((data) => {
              setChecks((current) => ({ ...current, [key]: data.check }));
              markSettled(key);
            })
            .catch((err) => {
              markSettled(key);
              if (handleAuth(err)) return;
              setChecks((current) => ({
                ...current,
                [key]: {
                  status: 'down',
                  error: err instanceof Error ? err.message : 'Kontrol basarisiz',
                },
              }));
            }),
        ),
      ];

      await Promise.allSettled(tasks);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    },
    [markSettled, paths.login, router, runUptimeProbes],
  );

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    void (async () => {
      if (!cancelled) await runProgressiveFetch(true);
    })();

    if (!autoRefresh) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      if (!cancelled) void runProgressiveFetch(false);
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [ready, autoRefresh, runProgressiveFetch]);

  useEffect(() => {
    if (!lastUpdated) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [lastUpdated]);

  const ramUsedPercent = meta
    ? memoryUsedPercent(meta.server.freeMemoryMb, meta.server.totalMemoryMb)
    : 0;
  const backendCapMb = 512;
  const backendUsedPercent = meta
    ? Math.min(100, Math.round((meta.backend.memoryMb / backendCapMb) * 100))
    : 0;

  const showDashboard = ready && (meta || completedCount > 0 || !loading);

  return (
    <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-admin-text">Izleme</h1>
          <p className="mt-1 text-sm text-admin-muted">
            Servisler paralel kontrol edilir · her {REFRESH_MS / 1000} sn yenilenir
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-admin-border bg-admin-surface-low px-4 py-2 text-sm text-admin-text">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
            Otomatik yenile
          </label>
          <button
            type="button"
            onClick={() => void runProgressiveFetch(false)}
            disabled={refreshing || loading}
            className="rounded-lg bg-admin-primary-container px-4 py-2 text-sm font-semibold text-admin-on-primary-container disabled:opacity-60"
          >
            {refreshing || (loading && !meta) ? 'Yenileniyor...' : 'Simdi Yenile'}
          </button>
        </div>
      </div>

      {!ready ? (
        <div className="h-40 animate-pulse rounded-xl border border-admin-border bg-admin-surface-low" />
      ) : null}

      {error ? (
        <div className="rounded-xl border border-admin-danger/40 bg-admin-surface-low px-5 py-4">
          <p className="font-medium text-admin-danger">{error}</p>
          <p className="mt-1 text-sm text-admin-muted">
            Oturum suresi dolmus olabilir. Tekrar giris yapmayi dene.
          </p>
          <Link
            href={paths.login}
            className="mt-3 inline-block rounded-lg bg-admin-danger px-4 py-2 text-sm text-admin-bg"
          >
            Giris Sayfasina Git
          </Link>
        </div>
      ) : null}

      {showDashboard ? (
        <>
          <section
            className={`rounded-xl border p-6 shadow-sm ${
              health.tone === 'emerald'
                ? 'border-emerald-500/30 bg-admin-surface-low'
                : health.tone === 'amber'
                  ? 'border-admin-primary/40 bg-admin-surface-low'
                  : 'border-admin-danger/40 bg-admin-surface-low'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-admin-bg shadow-sm">
                  <span
                    className={`absolute inline-flex h-4 w-4 rounded-full opacity-40 ${
                      uptimeRunning || !uptimeTotals.complete
                        ? 'animate-ping bg-amber-500'
                        : autoRefresh
                          ? 'bg-emerald-500'
                          : 'bg-admin-muted'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-4 w-4 rounded-full ${
                      uptimeRunning || !uptimeTotals.complete
                        ? 'bg-amber-500'
                        : autoRefresh
                          ? 'bg-emerald-500'
                          : 'bg-admin-muted'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-admin-mono text-sm font-semibold uppercase tracking-[0.18em] text-admin-muted">
                    Uptime Skoru
                  </p>
                  <h2 className="text-2xl font-bold text-admin-text">{health.label}</h2>
                  <p className="text-sm text-admin-muted">
                    {uptimeTotals.complete
                      ? `${uptimeTotals.success}/${uptimeTotals.total} basarili yanit · %${uptimeTotals.percent}`
                      : `${uptimeTotals.done}/${uptimeTotals.total} denendi · ${uptimeTotals.success} dondu`}
                    {lastUpdated && uptimeTotals.complete
                      ? ` · Son olcum ${formatAgo(lastUpdated)}`
                      : ''}
                  </p>
                </div>
              </div>
              {meta ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-admin-bg px-4 py-3 text-center">
                    <p className="text-xs text-admin-muted">Urun</p>
                    <p className="text-xl font-bold text-admin-text">{meta.stats.productCount ?? '-'}</p>
                  </div>
                  <div className="rounded-lg bg-admin-bg px-4 py-3 text-center">
                    <p className="text-xs text-admin-muted">Calisma</p>
                    <p className="text-sm font-bold text-admin-text">
                      {formatUptime(meta.backend.uptimeSeconds)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-admin-bg px-4 py-3 text-center">
                    <p className="text-xs text-admin-muted">RAM</p>
                    <p className="text-sm font-bold text-admin-text">{ramUsedPercent}% kullanim</p>
                  </div>
                  <div className="rounded-lg bg-admin-bg px-4 py-3 text-center">
                    <p className="text-xs text-admin-muted">Commit</p>
                    <p className="text-sm font-bold text-admin-text">
                      {meta.deploy?.commit?.slice(0, 7) ?? '-'}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-admin-text">Kontrol ilerlemesi</span>
                <span className="font-admin-mono text-admin-muted">
                  {completedCount}/{PROGRESS_TOTAL} · %{progressPercent}
                  {allSettled ? ` · ${healthyCount}/5 servis saglikli` : ''}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-admin-bg">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    allSettled
                      ? healthyCount === 5
                        ? 'bg-emerald-500'
                        : healthyCount >= 3
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      : 'bg-admin-primary'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    { key: 'meta' as const, label: 'Meta' },
                    ...SERVICE_CHECKS.map((item) => ({ key: item.key, label: item.title })),
                  ] as Array<{ key: ProgressKey; label: string }>
                ).map((item) => {
                  const done = Boolean(settled[item.key]);
                  const failed =
                    done &&
                    item.key !== 'meta' &&
                    checks[item.key as SystemStatusCheckName]?.status === 'down';
                  return (
                    <li
                      key={item.key}
                      className={`rounded-full px-3 py-1 font-admin-mono text-[11px] font-semibold ${
                        !done
                          ? 'bg-admin-bg text-admin-muted'
                          : failed
                            ? 'bg-admin-danger/15 text-admin-danger'
                            : 'bg-emerald-500/15 text-emerald-700'
                      }`}
                    >
                      {item.label}
                      {!done ? ' …' : failed ? ' ↓' : ' ✓'}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <UptimeHourChart points={uptimeHistory} />

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-admin-text">Anlik olcum</h2>
                <p className="text-sm text-admin-muted">
                  Bu tur: her hedefe {UPTIME_ATTEMPTS} istek · bitince 1 saatligine islenir
                </p>
              </div>
              <p className="font-admin-mono text-sm text-admin-muted">
                Toplam {uptimeTotals.success}/{uptimeTotals.total} · %{uptimeTotals.percent}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {UPTIME_TARGETS.map((target) => (
                <UptimeAxisCard
                  key={target.key}
                  title={target.title}
                  subtitle={target.subtitle}
                  probes={uptimeBoard[target.key]}
                />
              ))}
            </div>
          </section>

          <details
            className="rounded-xl border border-admin-border bg-admin-surface-low shadow-sm open:pb-2"
            open={detailsOpen}
            onToggle={(event) => setDetailsOpen((event.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer list-none px-6 py-4 marker:content-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-admin-text">Detaylar</p>
                  <p className="text-sm text-admin-muted">
                    Servis kartlari, sunucu metrikleri, deploy ve backup
                  </p>
                </div>
                <span className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-muted">
                  {detailsOpen ? 'Gizle' : 'Goster'}
                </span>
              </div>
            </summary>

            <div className="space-y-4 border-t border-admin-border px-4 py-4 md:px-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {SERVICE_CHECKS.map((item) => (
                  <ServiceCard
                    key={item.key}
                    title={item.title}
                    check={checks[item.key]}
                    pending={!settled[item.key]}
                  />
                ))}
              </section>

              {meta ? (
                <section className="grid items-start gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-admin-border bg-admin-bg/40 p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold text-admin-text">Sunucu Metrikleri</h3>
                    <div className="mt-5 space-y-4">
                      <MetricBar
                        label="RAM kullanimi"
                        value={`${meta.server.totalMemoryMb - meta.server.freeMemoryMb} / ${meta.server.totalMemoryMb} MB`}
                        percent={ramUsedPercent}
                        tone={
                          ramUsedPercent > 85
                            ? 'bg-red-500'
                            : ramUsedPercent > 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }
                      />
                      <MetricBar
                        label="Backend bellek"
                        value={`${meta.backend.memoryMb} / ${backendCapMb} MB`}
                        percent={backendUsedPercent}
                        tone={
                          backendUsedPercent > 85
                            ? 'bg-red-500'
                            : backendUsedPercent > 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-admin-border bg-admin-bg p-4">
                          <p className="text-sm text-admin-muted">Hostname</p>
                          <p className="mt-1 font-medium text-admin-text">{meta.server.hostname}</p>
                        </div>
                        <div className="rounded-lg border border-admin-border bg-admin-bg p-4">
                          <p className="text-sm text-admin-muted">Load average</p>
                          <p className="mt-1 font-medium text-admin-text">
                            {meta.server.loadAverage.join(' · ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-admin-border bg-admin-bg/40 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-admin-text">Deploy & CI</h3>
                      <dl className="mt-5 space-y-4 text-sm">
                        <div>
                          <dt className="text-admin-muted">Son commit</dt>
                          <dd className="mt-1 font-mono text-admin-text">
                            {meta.deploy?.commit ?? 'Bilinmiyor'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-admin-muted">Deploy zamani</dt>
                          <dd className="mt-1 text-admin-text">
                            {meta.deploy?.deployedAt
                              ? new Date(meta.deploy.deployedAt).toLocaleString('tr-TR')
                              : 'Bilinmiyor'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-admin-muted">Son kontrol</dt>
                          <dd className="mt-1 text-admin-text">
                            {new Date(meta.checkedAt).toLocaleString('tr-TR')}
                          </dd>
                        </div>
                      </dl>
                      <a
                        href={meta.links.githubActions}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-admin-border px-4 py-3 text-sm font-medium text-admin-muted transition hover:border-admin-primary hover:text-admin-primary"
                      >
                        GitHub Actions
                      </a>
                    </div>

                    {meta.backup ? <BackupCard backup={meta.backup} /> : null}
                  </div>
                </section>
              ) : (
                <div className="h-40 animate-pulse rounded-xl border border-admin-border bg-admin-bg/40" />
              )}
            </div>
          </details>
        </>
      ) : null}

      <span className="sr-only" aria-hidden>
        {tick}
      </span>
    </main>
  );
}

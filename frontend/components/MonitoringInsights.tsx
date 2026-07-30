'use client';

import type { SystemStatusMeta } from '@/lib/types';
import {
  averageOverall,
  findLastOutage,
  type UptimeHistoryPoint,
} from '@/lib/uptime-history';

function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MiniTrendChart({
  title,
  unit,
  color,
  points,
  now,
  rangeMs,
  valueFor,
  currentLabel,
}: {
  title: string;
  unit: string;
  color: string;
  points: UptimeHistoryPoint[];
  now: number;
  rangeMs: number;
  valueFor: (point: UptimeHistoryPoint) => number | null;
  currentLabel: string;
}) {
  const width = 420;
  const height = 160;
  const pad = { top: 10, right: 10, bottom: 22, left: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const start = now - rangeMs;
  const values = points
    .map((point) => valueFor(point))
    .filter((value): value is number => value != null && Number.isFinite(value));
  const maxValue = Math.max(1, ...values, 1);
  const latest = values.length > 0 ? values[values.length - 1] : null;

  const xFor = (at: number) =>
    pad.left + ((Math.max(start, Math.min(now, at)) - start) / rangeMs) * innerW;
  const yFor = (value: number) => pad.top + ((maxValue - value) / maxValue) * innerH;

  const pathPoints = points
    .map((point) => {
      const value = valueFor(point);
      if (value == null) return null;
      return { x: xFor(point.at), y: yFor(value) };
    })
    .filter((point): point is { x: number; y: number } => point != null);

  const path = pathPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  const area =
    pathPoints.length > 0
      ? `${path} L${pathPoints[pathPoints.length - 1].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} L${pathPoints[0].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`
      : '';

  const yTicks = [0, 0.5, 1].map((ratio) => Number((maxValue * (1 - ratio)).toFixed(ratio === 1 ? 0 : 1)));

  return (
    <article className="rounded-xl border border-admin-border bg-admin-surface-low p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-admin-text">{title}</h3>
          <p className="text-xs text-admin-muted">{unit}</p>
        </div>
        <p className="font-admin-mono text-lg font-bold text-admin-text">{currentLabel}</p>
      </div>
      <div className="mt-2 h-36 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="block h-full w-full">
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="currentColor"
                className="text-admin-border"
              />
              <text
                x={pad.left - 4}
                y={yFor(tick) + 3}
                textAnchor="end"
                className="fill-admin-muted font-admin-mono text-[9px]"
              >
                {tick}
              </text>
            </g>
          ))}
          {[0, 0.5, 1].map((ratio) => {
            const ts = start + ratio * rangeMs;
            return (
              <text
                key={ts}
                x={xFor(ts)}
                y={height - 4}
                textAnchor="middle"
                className="fill-admin-muted font-admin-mono text-[9px]"
              >
                {formatClock(ts)}
              </text>
            );
          })}
          {area ? <path d={area} fill={color} opacity="0.14" /> : null}
          {path ? (
            <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
          ) : null}
          {latest == null ? (
            <text x={width / 2} y={height / 2} textAnchor="middle" className="fill-admin-muted text-xs">
              Veri yok
            </text>
          ) : null}
        </svg>
      </div>
    </article>
  );
}

export default function MonitoringInsights({
  meta,
  points,
  now,
  rangeMs,
  lastRound,
}: {
  meta: SystemStatusMeta | null;
  points: UptimeHistoryPoint[];
  now: number;
  rangeMs: number;
  lastRound: UptimeHistoryPoint | null;
}) {
  const avgUptime = averageOverall(points);
  const lastOutage = findLastOutage(points);
  const ssl = meta?.ssl?.shop ?? meta?.ssl?.admin ?? null;
  const http = lastRound?.httpClasses;
  const httpTotal = http
    ? http.c2xx + http.c3xx + http.c4xx + http.c5xx + http.other
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-admin-muted">
            Donem Uptime
          </p>
          <p className="mt-2 font-admin-mono text-3xl font-bold text-admin-text">
            {avgUptime == null ? '-' : `${avgUptime}%`}
          </p>
          <p className="mt-2 text-sm text-admin-muted">
            Secili aralikta tum hedeflerin ortalama basari orani
          </p>
        </article>

        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-admin-muted">
            SSL Sertifikasi
          </p>
          <p className="mt-2 font-admin-mono text-3xl font-bold text-admin-text">
            {ssl?.daysRemaining == null ? '-' : `${ssl.daysRemaining} gun`}
          </p>
          <p className="mt-2 text-sm text-admin-muted">
            {ssl?.validTo
              ? `Bitis: ${new Date(ssl.validTo).toLocaleDateString('tr-TR')}`
              : 'HTTPS sertifika bilgisi alinamadi'}
            {ssl?.host ? ` · ${ssl.host}` : ''}
          </p>
        </article>

        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-admin-muted">
            Son Kesinti
          </p>
          <p className="mt-2 font-admin-mono text-3xl font-bold text-admin-text">
            {lastOutage ? `%${lastOutage.overall}` : 'YOK'}
          </p>
          <p className="mt-2 text-sm text-admin-muted">
            {lastOutage
              ? new Date(lastOutage.at).toLocaleString('tr-TR')
              : 'Secili aralikta outage tespit edilmedi'}
          </p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <h3 className="text-base font-semibold text-admin-text">HTTP yanit siniflari</h3>
          <p className="mt-1 text-sm text-admin-muted">Son olcum turundaki status kodlari</p>
          <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-admin-bg">
            {httpTotal > 0 && http ? (
              <>
                <div className="bg-emerald-500" style={{ width: `${(http.c2xx / httpTotal) * 100}%` }} />
                <div className="bg-sky-500" style={{ width: `${(http.c3xx / httpTotal) * 100}%` }} />
                <div className="bg-amber-500" style={{ width: `${(http.c4xx / httpTotal) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${(http.c5xx / httpTotal) * 100}%` }} />
                <div className="bg-admin-muted" style={{ width: `${(http.other / httpTotal) * 100}%` }} />
              </>
            ) : (
              <div className="w-full bg-admin-border/40" />
            )}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            <li className="rounded-lg bg-admin-bg px-3 py-2">
              <p className="text-xs text-admin-muted">2xx</p>
              <p className="font-admin-mono font-semibold text-admin-text">{http?.c2xx ?? 0}</p>
            </li>
            <li className="rounded-lg bg-admin-bg px-3 py-2">
              <p className="text-xs text-admin-muted">3xx</p>
              <p className="font-admin-mono font-semibold text-admin-text">{http?.c3xx ?? 0}</p>
            </li>
            <li className="rounded-lg bg-admin-bg px-3 py-2">
              <p className="text-xs text-admin-muted">4xx</p>
              <p className="font-admin-mono font-semibold text-admin-text">{http?.c4xx ?? 0}</p>
            </li>
            <li className="rounded-lg bg-admin-bg px-3 py-2">
              <p className="text-xs text-admin-muted">5xx</p>
              <p className="font-admin-mono font-semibold text-admin-text">{http?.c5xx ?? 0}</p>
            </li>
            <li className="rounded-lg bg-admin-bg px-3 py-2">
              <p className="text-xs text-admin-muted">Diger</p>
              <p className="font-admin-mono font-semibold text-admin-text">{http?.other ?? 0}</p>
            </li>
          </ul>
        </article>

        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <h3 className="text-base font-semibold text-admin-text">Latency yuzdelikleri</h3>
          <p className="mt-1 text-sm text-admin-muted">Son tur HTTP/DB kontrollerinin gecikmesi</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { label: 'AVERAGE', value: lastRound?.avgLatencyMs },
                { label: 'P50', value: lastRound?.p50LatencyMs },
                { label: 'P95', value: lastRound?.p95LatencyMs },
                { label: 'P99', value: lastRound?.p99LatencyMs },
              ] as const
            ).map((item) => (
              <div key={item.label} className="rounded-lg bg-admin-bg px-3 py-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-admin-muted">
                  {item.label}
                </p>
                <p className="mt-1 font-admin-mono text-xl font-bold text-admin-text">
                  {item.value == null ? '-' : `${Math.round(item.value)} ms`}
                </p>
              </div>
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-admin-border px-3 py-2">
              <dt className="text-admin-muted">Interval</dt>
              <dd className="font-medium text-admin-text">
                {meta?.monitor?.intervalSeconds ?? 30}s
              </dd>
            </div>
            <div className="rounded-lg border border-admin-border px-3 py-2">
              <dt className="text-admin-muted">Timeout</dt>
              <dd className="font-medium text-admin-text">
                {meta?.monitor?.timeoutSeconds ?? 8}s
              </dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MiniTrendChart
          title="CPU Trend"
          unit="Load bazli tahmini CPU %"
          color="#3b82f6"
          points={points}
          now={now}
          rangeMs={rangeMs}
          valueFor={(point) => point.resources?.cpuPercent ?? null}
          currentLabel={
            meta?.server.cpuPercent != null ? `${meta.server.cpuPercent}%` : '-'
          }
        />
        <MiniTrendChart
          title="Memory Trend"
          unit="Kullanilan RAM %"
          color="#14b8a6"
          points={points}
          now={now}
          rangeMs={rangeMs}
          valueFor={(point) => point.resources?.memoryUsedPercent ?? null}
          currentLabel={
            meta?.server.memoryUsedPercent != null
              ? `${meta.server.memoryUsedPercent}%`
              : '-'
          }
        />
        <MiniTrendChart
          title="Disk Trend"
          unit="Disk doluluk %"
          color="#a855f7"
          points={points}
          now={now}
          rangeMs={rangeMs}
          valueFor={(point) => point.resources?.diskUsedPercent ?? null}
          currentLabel={
            meta?.server.disk?.usedPercent != null
              ? `${meta.server.disk.usedPercent}%`
              : '-'
          }
        />
        <MiniTrendChart
          title="Load Average"
          unit="1 dk load"
          color="#f59e0b"
          points={points}
          now={now}
          rangeMs={rangeMs}
          valueFor={(point) => point.resources?.load1 ?? null}
          currentLabel={
            meta?.server.loadAverage?.[0] != null ? String(meta.server.loadAverage[0]) : '-'
          }
        />
        <MiniTrendChart
          title="Backend RSS"
          unit="Process bellek (MB)"
          color="#f43f5e"
          points={points}
          now={now}
          rangeMs={rangeMs}
          valueFor={(point) => point.resources?.backendMemoryMb ?? null}
          currentLabel={meta ? `${meta.backend.memoryMb} MB` : '-'}
        />
        <MiniTrendChart
          title="Network TX"
          unit="Toplam outbound (MB)"
          color="#22c55e"
          points={points}
          now={now}
          rangeMs={rangeMs}
          valueFor={(point) => point.resources?.networkTxMb ?? null}
          currentLabel={
            meta?.server.network?.txMb != null ? `${meta.server.network.txMb} MB` : '-'
          }
        />
      </div>
    </div>
  );
}

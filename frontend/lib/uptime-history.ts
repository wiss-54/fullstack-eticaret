export type UptimeTargetKey =
  | 'backend'
  | 'database'
  | 'api'
  | 'shop'
  | 'adminPanel';

export type UptimeHistoryScores = Record<UptimeTargetKey, number>;

export type UptimeHistoryResources = {
  cpuPercent: number;
  memoryUsedPercent: number;
  diskUsedPercent: number | null;
  load1: number;
  backendMemoryMb: number;
  networkRxMb: number | null;
  networkTxMb: number | null;
};

export type UptimeHistoryPoint = {
  at: number;
  scores: UptimeHistoryScores;
  overall: number;
  avgLatencyMs?: number;
  p50LatencyMs?: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  httpClasses?: { c2xx: number; c3xx: number; c4xx: number; c5xx: number; other: number };
  resources?: UptimeHistoryResources;
};

export type UptimeRangeId = '15m' | '1h' | '6h' | '1d';

export const UPTIME_RANGES: Array<{ id: UptimeRangeId; label: string; ms: number }> = [
  { id: '15m', label: '15 dk', ms: 15 * 60 * 1000 },
  { id: '1h', label: '1 saat', ms: 60 * 60 * 1000 },
  { id: '6h', label: '6 saat', ms: 6 * 60 * 60 * 1000 },
  { id: '1d', label: '1 gun', ms: 24 * 60 * 60 * 1000 },
];

const HISTORY_KEY = 'monitoring_uptime_history_v3';
export const UPTIME_HISTORY_MAX_MS = 24 * 60 * 60 * 1000;

export function emptyScores(): UptimeHistoryScores {
  return {
    backend: 0,
    database: 0,
    api: 0,
    shop: 0,
    adminPanel: 0,
  };
}

export function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function readUptimeHistory(): UptimeHistoryPoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY) ?? localStorage.getItem('monitoring_uptime_history_v2');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UptimeHistoryPoint[];
    if (!Array.isArray(parsed)) return [];
    return pruneUptimeHistory(parsed);
  } catch {
    return [];
  }
}

export function pruneUptimeHistory(
  points: UptimeHistoryPoint[],
  now = Date.now(),
): UptimeHistoryPoint[] {
  const cutoff = now - UPTIME_HISTORY_MAX_MS;
  return points
    .filter((point) => point.at >= cutoff)
    .sort((a, b) => a.at - b.at);
}

export function filterUptimeHistory(
  points: UptimeHistoryPoint[],
  rangeMs: number,
  now = Date.now(),
): UptimeHistoryPoint[] {
  const cutoff = now - rangeMs;
  return points.filter((point) => point.at >= cutoff);
}

export function appendUptimeHistoryPoint(
  point: Omit<UptimeHistoryPoint, 'at'> & { at?: number },
): UptimeHistoryPoint[] {
  const next = pruneUptimeHistory([
    ...readUptimeHistory(),
    {
      ...point,
      at: point.at ?? Date.now(),
    },
  ]);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function averageOverall(points: UptimeHistoryPoint[]) {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, point) => acc + point.overall, 0);
  return Number((sum / points.length).toFixed(2));
}

export function findLastOutage(points: UptimeHistoryPoint[]) {
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (points[i].overall < 100) {
      return points[i];
    }
  }
  return null;
}

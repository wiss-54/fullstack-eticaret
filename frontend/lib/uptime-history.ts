export type UptimeTargetKey =
  | 'backend'
  | 'database'
  | 'api'
  | 'shop'
  | 'adminPanel';

export type UptimeHistoryScores = Record<UptimeTargetKey, number>;

export type UptimeHistoryPoint = {
  at: number;
  scores: UptimeHistoryScores;
  overall: number;
};

export type UptimeRangeId = '15m' | '1h' | '6h' | '1d';

export const UPTIME_RANGES: Array<{ id: UptimeRangeId; label: string; ms: number }> = [
  { id: '15m', label: '15 dk', ms: 15 * 60 * 1000 },
  { id: '1h', label: '1 saat', ms: 60 * 60 * 1000 },
  { id: '6h', label: '6 saat', ms: 6 * 60 * 60 * 1000 },
  { id: '1d', label: '1 gun', ms: 24 * 60 * 60 * 1000 },
];

const HISTORY_KEY = 'monitoring_uptime_history_v2';
/** Keep at most 1 day of samples locally. */
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

export function readUptimeHistory(): UptimeHistoryPoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
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
  scores: UptimeHistoryScores,
  overall: number,
): UptimeHistoryPoint[] {
  const next = pruneUptimeHistory([
    ...readUptimeHistory(),
    {
      at: Date.now(),
      scores,
      overall,
    },
  ]);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

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

const HISTORY_KEY = 'monitoring_uptime_history_v1';
export const UPTIME_HISTORY_WINDOW_MS = 60 * 60 * 1000;

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
  const cutoff = now - UPTIME_HISTORY_WINDOW_MS;
  return points
    .filter((point) => point.at >= cutoff)
    .sort((a, b) => a.at - b.at);
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

'use client';

import { useEffect, useState } from 'react';
import { fetchDeployVersion } from '@/lib/version';

const POLL_MS = 60_000;

export default function DeployWatcher() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestCommit, setLatestCommit] = useState<string | null>(null);

  useEffect(() => {
    let knownCommit: string | null = null;
    let cancelled = false;

    async function checkVersion() {
      try {
        const version = await fetchDeployVersion();
        if (cancelled) return;

        if (!knownCommit) {
          knownCommit = version.commit;
          return;
        }

        if (version.commit !== knownCommit) {
          setLatestCommit(version.commit);
          setUpdateAvailable(true);
        }
      } catch {
        // Sessizce tekrar dene
      }
    }

    void checkVersion();
    const intervalId = window.setInterval(() => void checkVersion(), POLL_MS);

    function handleChunkError(event: ErrorEvent) {
      const message = event.message ?? '';
      if (
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError') ||
        message.includes('Failed to fetch dynamically imported module')
      ) {
        window.location.reload();
      }
    }

    window.addEventListener('error', handleChunkError);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('error', handleChunkError);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">Yeni surum hazir</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Site guncellendi{latestCommit ? ` (${latestCommit})` : ''}. En son hali gormek icin yenile.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Simdi Yenile
        </button>
      </div>
    </div>
  );
}

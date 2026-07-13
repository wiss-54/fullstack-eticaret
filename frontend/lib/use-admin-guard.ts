'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken, validateAdminSession } from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';

export function useAdminGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const paths = getAdminPaths();

    void (async () => {
      if (!getAdminToken()) {
        router.replace(paths.login);
        return;
      }

      const valid = await validateAdminSession();
      if (cancelled) return;

      if (!valid) {
        router.replace(paths.login);
        return;
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return ready;
}

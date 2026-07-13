'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomerToken, validateCustomerSession } from '@/lib/customer-api';

export function useCustomerGuard(redirectTo = '/giris') {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!getCustomerToken()) {
        router.replace(redirectTo);
        return;
      }

      const valid = await validateCustomerSession();
      if (cancelled) return;

      if (!valid) {
        router.replace(redirectTo);
        return;
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  return ready;
}

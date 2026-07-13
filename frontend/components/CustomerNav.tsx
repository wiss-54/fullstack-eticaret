'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCustomerToken, validateCustomerSession } from '@/lib/customer-api';

export default function CustomerNav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!getCustomerToken()) {
        if (!cancelled) setLoggedIn(false);
        return;
      }
      const valid = await validateCustomerSession();
      if (!cancelled) setLoggedIn(valid);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loggedIn) {
    return (
      <Link
        href="/hesabim"
        className="rounded-full border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-800 dark:text-amber-200"
      >
        Hesabim
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/giris"
        className="rounded-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300"
      >
        Giris
      </Link>
      <Link
        href="/kayit"
        className="rounded-full border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-800 dark:text-amber-200"
      >
        Kayit Ol
      </Link>
    </div>
  );
}

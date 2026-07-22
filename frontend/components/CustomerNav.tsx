'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCustomerToken, validateCustomerSession } from '@/lib/customer-api';

export default function CustomerNav() {
  const pathname = usePathname();
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
  }, [pathname]);

  if (loggedIn) {
    return (
      <Link
        href="/hesabim"
        className="rounded bg-store-primary px-4 py-2.5 text-sm font-semibold text-store-on-primary transition hover:opacity-90"
      >
        Hesabim
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        href="/giris"
        className="rounded px-3 py-2 text-sm font-medium text-store-muted transition hover:text-store-primary"
      >
        Giris
      </Link>
      <Link
        href="/kayit"
        className="hidden rounded bg-store-primary px-4 py-2.5 text-sm font-semibold text-store-on-primary transition hover:opacity-90 sm:inline-block"
      >
        Kayit Ol
      </Link>
    </div>
  );
}

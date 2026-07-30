'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCustomerToken, validateCustomerSession } from '@/lib/customer-api';

type Props = {
  variant?: 'default' | 'icon';
};

export default function CustomerNav({ variant = 'default' }: Props) {
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

  if (variant === 'icon') {
    return (
      <Link
        href={loggedIn ? '/hesabim' : '/giris'}
        aria-label={loggedIn ? 'Hesabim' : 'Giris'}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-store-text transition hover:bg-store-surface-low hover:text-store-primary"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      </Link>
    );
  }

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

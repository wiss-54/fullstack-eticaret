'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

export default function CartNav() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/sepet"
      className="relative rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
    >
      Sepet
      {itemCount > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}

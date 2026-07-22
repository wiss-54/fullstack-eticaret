'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

export default function CartNav() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/sepet"
      aria-label="Sepet"
      className="relative rounded p-2 text-store-muted transition hover:bg-store-surface-low hover:text-store-primary"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2l2.5 11h9.5L20 8H7" />
      </svg>
      {itemCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-store-primary px-1 text-[10px] font-semibold text-store-on-primary">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}

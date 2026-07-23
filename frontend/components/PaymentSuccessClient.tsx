'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CheckoutProgress from '@/components/CheckoutProgress';
import { orderDetailPath } from '@/lib/order-ref';

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode') ?? searchParams.get('orderId');

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 md:px-10">
      <CheckoutProgress active="confirm" />
      <div className="w-full rounded-xl bg-store-surface p-8 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-store-text">Siparisiniz Basariyla Alindi!</h1>
        <p className="mt-2 text-store-muted">
          Bizi tercih ettiginiz icin tesekkur ederiz. Siparisiniz hazirlaniyor.
        </p>
        {orderCode ? (
          <p className="mt-6 rounded-lg bg-store-surface-low px-4 py-3 text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wider text-store-muted">
              Siparis Numarasi
            </span>
            <span className="mt-1 block font-semibold text-store-primary">{orderCode}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderCode ? (
            <Link
              href={orderDetailPath(orderCode)}
              className="rounded-lg bg-store-primary-container px-5 py-3 text-center text-sm font-semibold text-store-on-primary transition hover:bg-store-primary"
            >
              Siparisi gor
            </Link>
          ) : null}
          <Link
            href="/hesabim"
            className="rounded-lg border border-store-border px-5 py-3 text-center text-sm font-semibold text-store-muted transition hover:border-store-primary hover:text-store-primary"
          >
            Hesabim
          </Link>
        </div>
      </div>
    </main>
  );
}

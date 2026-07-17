'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentFailClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason');

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-2xl border border-red-200 bg-white p-8 dark:border-red-900/40 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Odeme basarisiz</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Kart odemesi tamamlanamadi. Sepetindeki urunler saklanmadiysa tekrar deneyebilirsin.
        </p>
        {reason ? (
          <p className="mt-3 text-xs text-zinc-500">Kod: {reason}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/odeme"
            className="rounded-xl bg-amber-800 px-4 py-3 text-center text-sm font-medium text-white dark:bg-amber-500 dark:text-zinc-950"
          >
            Tekrar dene
          </Link>
          {orderId ? (
            <Link
              href={`/hesabim/siparis/${orderId}`}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Siparise git
            </Link>
          ) : (
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Ana sayfa
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

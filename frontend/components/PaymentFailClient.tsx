'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentFailClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason');

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 md:px-10">
      <div className="w-full rounded-xl bg-[#ffdad6] p-8 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#ba1a1a] text-white shadow-sm">
          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#93000a]">Odeme Islemi Basarisiz Oldu</h1>
        <p className="mt-2 text-[#93000a] opacity-90">
          Siparisiniz tamamlanamadi. Lutfen bilgilerinizi kontrol edip tekrar deneyin.
        </p>
        {reason ? (
          <p className="mt-3 text-xs text-[#93000a] opacity-70">Kod: {reason}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/odeme"
            className="rounded-lg bg-[#ba1a1a] px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
          >
            Tekrar Dene
          </Link>
          {orderId ? (
            <Link
              href={`/hesabim/siparis/${orderId}`}
              className="rounded-lg border border-[#93000a]/30 bg-white/50 px-5 py-3 text-center text-sm font-semibold text-[#93000a] transition hover:bg-white"
            >
              Siparise git
            </Link>
          ) : (
            <Link
              href="/"
              className="rounded-lg border border-[#93000a]/30 bg-white/50 px-5 py-3 text-center text-sm font-semibold text-[#93000a] transition hover:bg-white"
            >
              Ana sayfa
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

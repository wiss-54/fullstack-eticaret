'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { orderDetailPath } from '@/lib/order-ref';

export default function PaymentFailClient() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode') ?? searchParams.get('orderId');
  const reason = searchParams.get('reason');

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 md:px-10">
      <div className="w-full overflow-hidden rounded-xl bg-store-surface shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <div className="bg-[#ba1a1a] px-6 py-4 text-center text-white">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
          </div>
          <h1 className="text-lg font-bold">Odeme Islemi Basarisiz Oldu</h1>
        </div>
        <div className="p-8 text-center">
          <p className="text-store-muted">
            Odemeniz tamamlanamadi. Lutfen bilgilerinizi kontrol edip tekrar deneyin.
          </p>
          <div className="mt-6 rounded-lg bg-store-surface-low px-4 py-4 text-left text-sm text-store-muted">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-store-text">
              Olasi sebepler
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Yetersiz bakiye veya kart limiti</li>
              <li>Hatali 3D Secure sifresi</li>
              <li>Banka tarafindan islem reddi</li>
            </ul>
            {reason ? <p className="mt-3 text-xs opacity-70">Kod: {reason}</p> : null}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/odeme"
              className="rounded-lg bg-store-primary-container px-5 py-3 text-center text-sm font-semibold text-store-on-primary transition hover:bg-store-primary"
            >
              Tekrar Dene
            </Link>
            {orderCode ? (
              <Link
                href={orderDetailPath(orderCode)}
                className="rounded-lg border border-store-border px-5 py-3 text-center text-sm font-semibold text-store-muted transition hover:border-store-primary hover:text-store-primary"
              >
                Siparise git
              </Link>
            ) : (
              <Link
                href="/"
                className="rounded-lg border border-store-border px-5 py-3 text-center text-sm font-semibold text-store-muted transition hover:border-store-primary hover:text-store-primary"
              >
                Ana sayfa
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

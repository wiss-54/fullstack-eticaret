'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { customerCompleteMockPayment, customerGetOrder } from '@/lib/customer-api';
import type { Order } from '@/lib/types';
import { useCustomerGuard } from '@/lib/use-customer-guard';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

export default function MockCardPaymentClient() {
  const ready = useCustomerGuard('/giris?return=/odeme/kart');
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = Number(searchParams.get('orderId'));
  const token = searchParams.get('token') ?? '';
  const provider = searchParams.get('provider');

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!Number.isInteger(orderId) || orderId <= 0 || !token) {
      setError('Gecersiz odeme baglantisi');
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const data = await customerGetOrder(orderId);
        if (cancelled) return;
        if (data.paymentStatus === 'paid') {
          router.replace(`/odeme/basarili?orderId=${orderId}`);
          return;
        }
        setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Siparis yuklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, orderId, token, router]);

  async function complete(success: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      await customerCompleteMockPayment({ orderId, token, success });
      if (success) {
        router.replace(`/odeme/basarili?orderId=${orderId}`);
      } else {
        router.replace(`/odeme/basarisiz?orderId=${orderId}&reason=cancelled`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Odeme tamamlanamadi');
      setSubmitting(false);
    }
  }

  if (!ready || loading) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-zinc-500">Odeme sayfasi yukleniyor...</p>
      </main>
    );
  }

  if (provider === 'paytr') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">PayTR Odeme</h1>
        <iframe
          title="PayTR"
          src={`https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}`}
          className="h-[720px] w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800"
          frameBorder={0}
          scrolling="no"
        />
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <div className="rounded-2xl border border-red-200 bg-white p-8 dark:border-red-900/40 dark:bg-zinc-950">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <Link href="/odeme" className="mt-4 inline-block text-sm text-amber-800 dark:text-amber-300">
            Odemeye don
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          PayTR on gosterim (mock)
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Kart ile odeme</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          PayTR merchant bilgileri henuz yok. Anahtarlar gelince ayni akis gercek PayTR iframe
          acacak.
        </p>

        {order ? (
          <div className="mt-6 space-y-3 rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Siparis #{order.id}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrice(order.total)}
              </p>
            </div>
            {(order.shippingCity || order.shippingAddress) && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Teslimat:{' '}
                {order.shippingCity
                  ? `${order.shippingAddressLine ?? ''}, ${order.shippingDistrict} / ${order.shippingCity}`
                  : order.shippingAddress}
              </p>
            )}
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void complete(true)}
            className="flex-1 rounded-xl bg-amber-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-60 dark:bg-amber-500 dark:text-zinc-950"
          >
            {submitting ? 'Isleniyor...' : 'Odemeyi onayla (demo)'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void complete(false)}
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200"
          >
            Iptal et
          </button>
        </div>
      </div>
    </main>
  );
}

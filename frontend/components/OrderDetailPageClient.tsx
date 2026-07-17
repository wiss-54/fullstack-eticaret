'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Order } from '@/lib/types';
import { customerGetOrder } from '@/lib/customer-api';
import { orderStatusBadgeClass, orderStatusLabel } from '@/lib/order-status';
import { paymentMethodLabel, paymentStatusLabel } from '@/lib/payment-labels';
import { useCustomerGuard } from '@/lib/use-customer-guard';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

const POLL_MS = 12_000;

export default function OrderDetailPageClient() {
  const ready = useCustomerGuard();
  const params = useParams();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(
    async (silent = false) => {
      if (!Number.isInteger(orderId)) return;
      try {
        const data = await customerGetOrder(orderId);
        setOrder(data);
        setError(null);
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Siparis yuklenemedi');
        }
      }
    },
    [orderId],
  );

  useEffect(() => {
    if (!ready || !Number.isInteger(orderId)) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await customerGetOrder(orderId);
        if (!cancelled) setOrder(data);
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
  }, [ready, orderId]);

  useEffect(() => {
    if (!ready || !Number.isInteger(orderId)) return;

    const onFocus = () => {
      void loadOrder(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadOrder(true);
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadOrder(true);
      }
    }, POLL_MS);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ready, orderId, loadOrder]);

  if (!ready || loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-zinc-500">Yukleniyor...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error ?? 'Siparis bulunamadi'}
        </p>
        <Link href="/hesabim" className="mt-4 inline-block text-sm text-amber-800 hover:underline dark:text-amber-300">
          Hesabima don
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/hesabim" className="text-sm text-amber-800 hover:underline dark:text-amber-300">
          ← Hesabima don
        </Link>
        <button
          type="button"
          onClick={() => void loadOrder()}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          Durumu yenile
        </button>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Siparis #{order.id}</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{formatDate(order.createdAt)}</p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${orderStatusBadgeClass(order.status)}`}
          >
            {orderStatusLabel(order.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">Teslimat</p>
            <p className="mt-1 whitespace-pre-wrap">
              {order.shippingCity
                ? `${order.shippingAddressLine ?? ''}\n${order.shippingDistrict} / ${order.shippingCity}`
                : order.shippingAddress}
            </p>
            {order.customerPhone ? <p className="mt-1">{order.customerPhone}</p> : null}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">Odeme</p>
            <p className="mt-1">
              {paymentMethodLabel(order.paymentMethod)}
              {order.paymentStatus ? ` · ${paymentStatusLabel(order.paymentStatus)}` : ''}
            </p>
            {order.orderNote ? <p className="mt-2">Not: {order.orderNote}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Urunler</h2>
        <ul className="mt-4 space-y-4">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="border-b border-zinc-100 pb-4 last:border-0 dark:border-zinc-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.productName}</p>
                  {item.variantLabel ? (
                    <p className="text-sm text-amber-800 dark:text-amber-200">{item.variantLabel}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                  {item.selectedOptions.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.selectedOptions.map((option) => (
                        <li key={`${item.id}-${option.optionId}`}>
                          {option.label}: {option.value}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{formatPrice(item.lineTotal)}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-right text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Toplam: {formatPrice(order.total)}
        </p>
      </section>
    </main>
  );
}

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
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
        <p className="text-store-muted">Yukleniyor...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Siparis bulunamadi'}
        </p>
        <Link
          href="/hesabim"
          className="mt-4 inline-block text-sm font-semibold text-store-primary hover:underline"
        >
          Hesabima don
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/hesabim"
          className="text-sm font-semibold text-store-primary hover:underline"
        >
          ← Hesabima don
        </Link>
        <button
          type="button"
          onClick={() => void loadOrder()}
          className="rounded-lg border border-store-border px-3 py-1.5 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
        >
          Durumu yenile
        </button>
      </div>

      <section className="rounded-xl bg-store-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-store-text">Siparis #{order.id}</h1>
            <p className="mt-2 text-sm text-store-muted">{formatDate(order.createdAt)}</p>
          </div>
          <span
            className={`inline-flex rounded px-3 py-1.5 text-sm font-semibold ${orderStatusBadgeClass(order.status)}`}
          >
            {orderStatusLabel(order.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 text-sm text-store-muted sm:grid-cols-2">
          <div>
            <p className="font-semibold text-store-text">Teslimat</p>
            <p className="mt-1 whitespace-pre-wrap">
              {order.shippingCity
                ? `${order.shippingAddressLine ?? ''}\n${order.shippingDistrict} / ${order.shippingCity}`
                : order.shippingAddress}
            </p>
            {order.customerPhone ? <p className="mt-1">{order.customerPhone}</p> : null}
          </div>
          <div>
            <p className="font-semibold text-store-text">Odeme</p>
            <p className="mt-1">
              {paymentMethodLabel(order.paymentMethod)}
              {order.paymentStatus ? ` · ${paymentStatusLabel(order.paymentStatus)}` : ''}
            </p>
            {order.orderNote ? <p className="mt-2">Not: {order.orderNote}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-store-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <h2 className="text-xl font-semibold text-store-text">Urunler</h2>
        <ul className="mt-4 space-y-4">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="border-b border-store-border pb-4 last:border-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-store-text">{item.productName}</p>
                  {item.variantLabel ? (
                    <p className="text-sm text-store-accent-text">{item.variantLabel}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-store-muted">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                  {item.selectedOptions.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-store-muted">
                      {item.selectedOptions.map((option) => (
                        <li key={`${item.id}-${option.optionId}`}>
                          {option.label}: {option.value}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <p className="font-semibold text-store-text">{formatPrice(item.lineTotal)}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-right text-xl font-bold text-store-primary-container">
          Toplam: {formatPrice(order.total)}
        </p>
      </section>
    </main>
  );
}

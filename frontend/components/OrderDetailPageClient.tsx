'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Order, OrderStatus } from '@/lib/types';
import { customerGetOrder } from '@/lib/customer-api';
import { orderStatusBadgeClass, orderStatusLabel } from '@/lib/order-status';
import { orderRef } from '@/lib/order-ref';
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

const TRACK_STEPS = [
  'Siparis Alindi',
  'Hazirlaniyor',
  'Kargoya Verildi',
  'Teslim Edildi',
] as const;

/** Visual tracker index; `shipped` stops at "Kargoya Verildi" (no delivered status yet). */
function stepIndex(status: OrderStatus) {
  if (status === 'cancelled') return -1;
  if (status === 'pending' || status === 'confirmed') return 0;
  if (status === 'preparing') return 1;
  if (status === 'shipped') return 2;
  return 0;
}

export default function OrderDetailPageClient() {
  const ready = useCustomerGuard();
  const params = useParams();
  const orderKey = String(params.id ?? '');

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(
    async (silent = false) => {
      if (!orderKey) return;
      try {
        const data = await customerGetOrder(orderKey);
        setOrder(data);
        setError(null);
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Siparis yuklenemedi');
        }
      }
    },
    [orderKey],
  );

  useEffect(() => {
    if (!ready || !orderKey) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await customerGetOrder(orderKey);
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
  }, [ready, orderKey]);

  useEffect(() => {
    if (!ready || !orderKey) return;

    const onFocus = () => {
      void loadOrder(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void loadOrder(true);
    };
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadOrder(true);
    }, POLL_MS);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ready, orderKey, loadOrder]);

  const activeStep = useMemo(
    () => (order ? stepIndex(order.status) : 0),
    [order],
  );

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

  const address = order.shippingCity
    ? `${order.shippingAddressLine ?? ''}, ${order.shippingDistrict} / ${order.shippingCity}`
    : order.shippingAddress;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-10 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/hesabim"
            className="text-sm font-semibold text-store-primary hover:underline"
          >
            ← Hesabima don
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-store-text">
            Siparis #{orderRef(order)}
          </h1>
          <p className="mt-1 text-sm text-store-muted">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${orderStatusBadgeClass(order.status)}`}
          >
            {orderStatusLabel(order.status)}
          </span>
          <button
            type="button"
            onClick={() => void loadOrder()}
            className="rounded-lg border border-store-border px-3 py-1.5 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
          >
            Yenile
          </button>
        </div>
      </div>

      {order.status === 'cancelled' ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Bu siparis iptal edildi.
        </p>
      ) : (
        <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {TRACK_STEPS.map((label, index) => {
              const done = activeStep >= 0 && index <= activeStep;
              const current = index === activeStep;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? 'bg-store-primary-container text-store-on-primary'
                        : 'bg-store-surface-low text-store-muted'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p
                    className={`text-sm font-semibold ${
                      current || done ? 'text-store-text' : 'text-store-muted'
                    }`}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-6">
          <h2 className="text-xl font-semibold text-store-text">Urunler</h2>
          <ul className="mt-4 space-y-4">
            {(order.items ?? []).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-store-border pb-4 last:border-0"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-store-border bg-store-bg text-[10px] text-store-muted">
                    Urun
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-store-text">{item.productName}</p>
                    {item.variantLabel ? (
                      <p className="text-sm text-store-accent-text">{item.variantLabel}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-store-muted">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-store-text">{formatPrice(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <h3 className="font-semibold text-store-text">Siparis Ozeti</h3>
            <div className="mt-4 space-y-2 text-sm text-store-muted">
              <div className="flex justify-between">
                <span>Ara Toplam</span>
                <span className="text-store-text">{formatPrice(order.subtotal ?? order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kargo</span>
                <span className="text-store-primary">Ucretsiz</span>
              </div>
              <div className="flex justify-between border-t border-store-border pt-3 text-base font-bold text-store-text">
                <span>Toplam</span>
                <span className="text-store-primary-container">{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <h3 className="font-semibold text-store-text">Teslimat Bilgileri</h3>
            <p className="mt-2 text-sm font-medium text-store-text">{order.customerName}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-store-muted">{address}</p>
            {order.customerPhone ? (
              <p className="mt-2 text-sm text-store-muted">{order.customerPhone}</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <h3 className="font-semibold text-store-text">Odeme Bilgileri</h3>
            <p className="mt-2 text-sm text-store-muted">
              {paymentMethodLabel(order.paymentMethod)}
              {order.paymentStatus ? ` · ${paymentStatusLabel(order.paymentStatus)}` : ''}
            </p>
            {order.orderNote ? (
              <p className="mt-2 text-sm text-store-muted">Not: {order.orderNote}</p>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

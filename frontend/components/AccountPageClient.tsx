'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Order, User } from '@/lib/types';
import {
  clearCustomerToken,
  customerGetMe,
  customerGetOrders,
} from '@/lib/customer-api';
import { orderStatusBadgeClass, orderStatusLabel } from '@/lib/order-status';
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

export default function AccountPageClient() {
  const ready = useCustomerGuard();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async (silent = false) => {
    try {
      const orderList = await customerGetOrders();
      setOrders(orderList);
      setError(null);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Siparisler yuklenemedi');
      }
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    void (async () => {
      try {
        const [profile, orderList] = await Promise.all([
          customerGetMe(),
          customerGetOrders(),
        ]);
        if (!cancelled) {
          setUser(profile);
          setOrders(orderList);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Bilgiler yuklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const onFocus = () => {
      void loadOrders(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadOrders(true);
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadOrders(true);
      }
    }, POLL_MS);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ready, loadOrders]);

  function handleLogout() {
    clearCustomerToken();
    router.replace('/');
    router.refresh();
  }

  if (!ready || loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
        <p className="text-store-muted">Yukleniyor...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 md:px-10">
      <section className="rounded-xl bg-store-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-store-text">Hesap Bilgileri</h2>
            {user ? (
              <div className="mt-3 space-y-1 text-sm text-store-muted">
                <p className="font-medium text-store-text">{user.fullName}</p>
                <p>{user.email}</p>
                {user.phone ? <p>{user.phone}</p> : null}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-store-border px-4 py-2 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
          >
            Cikis Yap
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-store-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-store-text">Siparislerim</h2>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="rounded-lg border border-store-border px-3 py-1.5 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
          >
            Yenile
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-store-muted">Henuz siparisin yok.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/hesabim/siparis/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-store-border p-4 transition hover:border-store-primary"
              >
                <div>
                  <p className="font-semibold text-store-text">Siparis #{order.id}</p>
                  <p className="mt-1 text-sm text-store-muted">{formatDate(order.createdAt)}</p>
                  <span
                    className={`mt-2 inline-flex rounded px-2.5 py-1 text-xs font-medium ${orderStatusBadgeClass(order.status)}`}
                  >
                    {orderStatusLabel(order.status)}
                  </span>
                </div>
                <p className="font-bold text-store-primary-container">{formatPrice(order.total)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

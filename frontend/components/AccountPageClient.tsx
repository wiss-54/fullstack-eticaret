'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Order, User } from '@/lib/types';
import {
  clearCustomerToken,
  customerGetMe,
  customerGetOrders,
} from '@/lib/customer-api';
import { useCustomerGuard } from '@/lib/use-customer-guard';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandi',
  preparing: 'Hazirlaniyor',
  shipped: 'Kargoda',
  cancelled: 'Iptal',
};

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

export default function AccountPageClient() {
  const ready = useCustomerGuard();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  function handleLogout() {
    clearCustomerToken();
    router.replace('/');
    router.refresh();
  }

  if (!ready || loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-zinc-500">Yukleniyor...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Hesap Bilgileri</h2>
            {user ? (
              <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <p>{user.fullName}</p>
                <p>{user.email}</p>
                {user.phone ? <p>{user.phone}</p> : null}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Cikis Yap
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Siparislerim</h2>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Henuz siparisin yok.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/hesabim/siparis/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 transition hover:border-amber-300 dark:border-zinc-800 dark:hover:border-amber-800"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">Siparis #{order.id}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(order.createdAt)} · {STATUS_LABELS[order.status] ?? order.status}
                  </p>
                </div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{formatPrice(order.total)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

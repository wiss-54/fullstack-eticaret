'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Order, OrderStatus } from '@/lib/types';
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  getAdminToken,
} from '@/lib/admin-api';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { getAdminPaths } from '@/lib/admin-paths';
import { paymentMethodLabel, paymentStatusLabel } from '@/lib/payment-labels';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'confirmed', label: 'Onaylandi' },
  { value: 'preparing', label: 'Hazirlaniyor' },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'cancelled', label: 'Iptal' },
];

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

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const paths = getAdminPaths();

    if (!getAdminToken()) {
      router.replace(paths.login);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const data = await adminGetOrders();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Siparisler yuklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleStatusChange(orderId: number, status: OrderStatus) {
    setUpdatingId(orderId);
    setError(null);
    try {
      const updated = await adminUpdateOrderStatus(orderId, status);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durum guncellenemedi');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
      <AdminPageHeader
        title="Siparis Yonetimi"
        description="Musteri siparislerini goruntule ve durum guncelle"
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-admin-danger/40 bg-admin-bg px-4 py-3 text-sm text-admin-danger">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-admin-muted">Yukleniyor...</p>
      ) : orders.length === 0 ? (
        <p className="text-admin-muted">Henuz siparis yok.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-admin-text">
                    Siparis #{order.id} · {order.customerName}
                  </p>
                  <p className="mt-1 text-sm text-admin-muted">
                    {order.customerEmail}
                    {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                  </p>
                  <p className="mt-1 font-admin-mono text-sm text-admin-muted">
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-admin-text">
                    {formatPrice(order.total)} · {paymentMethodLabel(order.paymentMethod)}
                    {order.paymentStatus ? ` · ${paymentStatusLabel(order.paymentStatus)}` : ''}
                  </p>
                </div>

                <label className="text-sm">
                  <span className="mb-1 block text-admin-muted">Durum</span>
                  <select
                    className="rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-admin-text outline-none ring-admin-primary/30 focus:ring-2"
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => void handleStatusChange(order.id, e.target.value as OrderStatus)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {order.items && order.items.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-admin-border pt-4 text-sm text-admin-muted">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span>
                        {item.productName}
                        {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
                      </span>
                      <span className="text-admin-text">{formatPrice(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-3 text-sm text-admin-muted">
                Adres:{' '}
                {order.shippingCity
                  ? `${order.shippingAddressLine ?? ''}, ${order.shippingDistrict} / ${order.shippingCity}`
                  : order.shippingAddress}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Order, OrderStatus } from '@/lib/types';
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  getAdminToken,
} from '@/lib/admin-api';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { getAdminPaths } from '@/lib/admin-paths';
import { paymentStatusLabel } from '@/lib/payment-labels';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'confirmed', label: 'Onaylandi' },
  { value: 'preparing', label: 'Hazirlaniyor' },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'cancelled', label: 'Iptal' },
];

const PAGE_SIZE = 8;

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

function orderAddress(order: Order) {
  if (order.shippingCity) {
    return [order.shippingAddressLine, order.shippingDistrict, order.shippingCity]
      .filter(Boolean)
      .join(', ');
  }
  return order.shippingAddress;
}

function isPaid(order: Order) {
  return order.paymentStatus === 'paid';
}

function paymentBadgeClass(order: Order) {
  if (isPaid(order)) {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500';
  }
  return 'border-admin-primary/25 bg-admin-primary-container/15 text-admin-primary';
}

function exportCsv(orders: Order[]) {
  const header = [
    'id',
    'publicCode',
    'customerName',
    'customerEmail',
    'status',
    'paymentStatus',
    'total',
    'createdAt',
  ];
  const rows = orders.map((order) =>
    [
      order.id,
      order.publicCode,
      JSON.stringify(order.customerName),
      order.customerEmail,
      order.status,
      order.paymentStatus ?? '',
      order.total,
      order.createdAt,
    ].join(',')
  );
  const blob = new Blob([[header.join(','), ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `siparisler-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [page, setPage] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

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

  const stats = useMemo(() => {
    const yeni = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
    const hazirlanan = orders.filter((o) => o.status === 'preparing').length;
    const kargoda = orders.filter((o) => o.status === 'shipped').length;
    const iptal = orders.filter((o) => o.status === 'cancelled').length;
    return { yeni, hazirlanan, kargoda, iptal };
  }, [orders]);

  const filtered = useMemo(() => {
    const list =
      statusFilter === 'all' ? orders : orders.filter((order) => order.status === statusFilter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filtered.length, currentPage * PAGE_SIZE + PAGE_SIZE);

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
    <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8 md:py-8">
      <AdminPageHeader
        title="Siparis Yonetimi"
        description="Musteri siparislerini goruntule, filtrele ve durum guncelle"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilter((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg border border-admin-border bg-admin-bg px-4 py-2 text-sm text-admin-text transition hover:border-admin-primary"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
              Filtrele
            </button>
            <button
              type="button"
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-admin-primary-container px-4 py-2 text-sm font-semibold text-admin-on-primary-container transition hover:brightness-105 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 4v10" />
                <path d="m8 10 4 4 4-4" />
                <path d="M5 18h14" />
              </svg>
              Disa Aktar
            </button>
          </div>
        }
      />

      {showFilter ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-admin-border bg-admin-surface-low p-3">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setPage(0);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              statusFilter === 'all'
                ? 'bg-admin-primary-container text-admin-on-primary-container'
                : 'border border-admin-border text-admin-muted'
            }`}
          >
            Tumu
          </button>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setStatusFilter(option.value);
                setPage(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                statusFilter === option.value
                  ? 'bg-admin-primary-container text-admin-on-primary-container'
                  : 'border border-admin-border text-admin-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-admin-danger/40 bg-admin-bg px-4 py-3 text-sm text-admin-danger">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm text-admin-muted">Yeni Siparisler</h3>
            <svg className="h-5 w-5 text-admin-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2 9.5 8.5 3 9.5l5 4.2L6.5 20 12 16.8 17.5 20 16 13.7l5-4.2-6.5-1L12 2Z" />
            </svg>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.yeni}</p>
          <p className="mt-2 text-xs text-emerald-500">Bekleyen / onaylanan</p>
        </article>
        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm text-admin-muted">Hazirlananlar</h3>
            <svg className="h-5 w-5 text-admin-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 7h8v12H8z" />
              <path d="M10 7V5h4v2" />
            </svg>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.hazirlanan}</p>
          <p className="mt-2 text-xs text-admin-muted">Su an isleniyor</p>
        </article>
        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm text-admin-muted">Kargodaki Siparisler</h3>
            <svg className="h-5 w-5 text-admin-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 7h11v10H3z" />
              <path d="M14 10h4l3 3v4h-7" />
              <circle cx="7" cy="18" r="1.5" />
              <circle cx="17" cy="18" r="1.5" />
            </svg>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.kargoda}</p>
          <p className="mt-2 text-xs text-admin-muted">Dagitimda</p>
        </article>
        <article className="rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm text-admin-muted">Iptaller</h3>
            <svg className="h-5 w-5 text-admin-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.iptal}</p>
          <p className="mt-2 text-xs text-admin-danger">Islem bekliyor</p>
        </article>
      </section>

      {loading ? (
        <p className="text-admin-muted">Yukleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className="text-admin-muted">Henuz siparis yok.</p>
      ) : (
        <>
          <div className="hidden items-center border-b border-admin-border px-4 py-3 font-admin-mono text-[11px] uppercase tracking-wider text-admin-muted md:flex">
            <div className="w-2/12">Siparis No</div>
            <div className="w-3/12">Musteri & Adres</div>
            <div className="w-3/12">Urunler</div>
            <div className="w-2/12">Odeme</div>
            <div className="w-2/12">Durum Islemi</div>
          </div>

          <div className="flex flex-col gap-3">
            {pageItems.map((order) => {
              const firstItem = order.items?.[0];
              const extraCount = Math.max(0, (order.items?.length ?? 0) - 1);
              return (
                <article
                  key={order.id}
                  className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface-low p-4 transition hover:border-admin-primary/40 md:flex-row md:items-center"
                >
                  <div className="flex items-center justify-between border-b border-admin-border pb-2 md:hidden">
                    <span className="font-admin-mono text-[11px] uppercase text-admin-muted">
                      Siparis No
                    </span>
                    <span className="font-semibold text-admin-text">
                      #{order.publicCode || order.id}
                    </span>
                  </div>

                  <div className="hidden w-2/12 md:block">
                    <p className="font-semibold text-admin-text">
                      #{order.publicCode || order.id}
                    </p>
                    <p className="mt-1 font-admin-mono text-xs text-admin-muted">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="w-full md:w-3/12">
                    <p className="mb-1 font-medium text-admin-text">{order.customerName}</p>
                    <div className="flex items-start gap-1 text-sm text-admin-muted">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      <span className="line-clamp-2">{orderAddress(order)}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-3/12">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-admin-border bg-admin-bg text-[10px] text-admin-muted">
                        Urun
                      </div>
                      <span className="truncate text-sm text-admin-text">
                        {firstItem?.productName ?? 'Urun bilgisi yok'}
                      </span>
                    </div>
                    <p className="text-xs text-admin-muted">
                      {extraCount > 0 ? `+${extraCount} urun daha · ` : ''}
                      Toplam {formatPrice(order.total)}
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-between md:w-2/12 md:justify-start">
                    <span className="font-admin-mono text-[11px] uppercase text-admin-muted md:hidden">
                      Odeme
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${paymentBadgeClass(order)}`}
                    >
                      {isPaid(order) ? 'Odendi' : paymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>

                  <div className="w-full md:w-2/12">
                    <select
                      className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text outline-none ring-admin-primary/30 focus:ring-2"
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) =>
                        void handleStatusChange(order.id, e.target.value as OrderStatus)
                      }
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-admin-border pt-4 text-sm text-admin-muted">
            <span>
              Gosterilen: {rangeStart}-{rangeEnd} / Toplam: {filtered.length} siparis
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-admin-border px-3 py-2 disabled:opacity-40"
              >
                {'<'}
              </button>
              <button
                type="button"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded-lg border border-admin-border px-3 py-2 disabled:opacity-40"
              >
                {'>'}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

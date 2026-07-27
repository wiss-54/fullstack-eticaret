'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Order, OrderStatus, Product } from '@/lib/types';
import { adminGetOrders, adminGetProducts, getAdminToken } from '@/lib/admin-api';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { getAdminPaths } from '@/lib/admin-paths';
import { safeMediaUrl } from '@/lib/safe-media-url';

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

function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Beklemede';
    case 'confirmed':
      return 'Onaylandi';
    case 'preparing':
      return 'Hazirlaniyor';
    case 'shipped':
      return 'Kargoda';
    case 'cancelled':
      return 'Iptal';
    default:
      return status;
  }
}

function orderStatusClass(status: OrderStatus) {
  switch (status) {
    case 'shipped':
      return 'bg-emerald-500/15 text-emerald-600';
    case 'confirmed':
    case 'preparing':
      return 'bg-sky-500/15 text-sky-600';
    case 'cancelled':
      return 'bg-admin-danger/15 text-admin-danger';
    default:
      return 'bg-admin-primary-container/20 text-admin-primary';
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const paths = getAdminPaths();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace(paths.login);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [productData, orderData] = await Promise.all([
          adminGetProducts(),
          adminGetOrders(),
        ]);
        if (!cancelled) {
          setProducts(productData);
          setOrders(orderData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Dashboard yuklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paths.login, router]);

  const stats = useMemo(() => {
    const revenue = orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 5);
    const outOfStock = products.filter((product) => product.stock <= 0);
    return {
      productCount: products.length,
      orderCount: orders.length,
      revenue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      lowStockItems: [...outOfStock, ...lowStock].slice(0, 8),
      recentOrders: [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    };
  }, [orders, products]);

  const cards = [
    {
      title: 'Urunler',
      value: String(stats.productCount),
      hint: 'Katalog kalemi',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16v12H4z" />
          <path d="M4 7l2-3h12l2 3" />
        </svg>
      ),
    },
    {
      title: 'Siparisler',
      value: String(stats.orderCount),
      hint: 'Musteri siparisi',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 7h18v12H3z" />
          <path d="M8 7V5h8v2" />
        </svg>
      ),
    },
    {
      title: 'Ciro',
      value: formatPrice(stats.revenue),
      hint: 'Siparis tutari',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 16l5-5 4 4 7-7" />
          <path d="M15 8h5v5" />
        </svg>
      ),
    },
    {
      title: 'Azalan Stok',
      value: String(stats.lowStockCount),
      hint: 'Stok <= 5',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
        </svg>
      ),
    },
    {
      title: 'Tukenen',
      value: String(stats.outOfStockCount),
      hint: 'Stok yok',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </svg>
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 md:px-8 md:py-8">
      <AdminPageHeader
        title="Dashboard"
        description="Magaza ozeti, son siparisler ve stok uyarilari"
      />

      {error ? (
        <p className="rounded-xl border border-admin-danger/40 bg-admin-surface-low px-4 py-3 text-sm text-admin-danger">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-admin-muted">Yukleniyor...</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-admin-border bg-admin-surface-low p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-admin-muted">{card.title}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-admin-text">
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs text-admin-muted">{card.hint}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin-surface-high text-admin-primary">
                    {card.icon}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <article className="rounded-2xl border border-admin-border bg-admin-surface-low p-5 shadow-sm xl:col-span-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-admin-text">Son Siparisler</h2>
                  <p className="text-sm text-admin-muted">En son musteri hareketleri</p>
                </div>
                <Link
                  href={paths.orders}
                  className="rounded-lg border border-admin-border px-3 py-1.5 text-sm text-admin-text transition hover:border-admin-primary"
                >
                  Tumunu gor
                </Link>
              </div>

              {stats.recentOrders.length === 0 ? (
                <p className="py-8 text-sm text-admin-muted">Henuz siparis yok.</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentOrders.map((order) => {
                    const itemCount =
                      order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
                    return (
                      <div
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-admin-border bg-admin-bg px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-admin-mono text-sm font-semibold text-admin-text">
                            #{order.publicCode || order.id}
                          </p>
                          <p className="mt-1 truncate text-sm text-admin-muted">
                            {order.customerEmail} · {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusClass(order.status)}`}
                          >
                            {orderStatusLabel(order.status)}
                          </span>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-admin-text">
                              {formatPrice(order.total)}
                            </p>
                            <p className="text-xs text-admin-muted">{itemCount} urun</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-admin-border bg-admin-surface-low p-5 shadow-sm xl:col-span-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-admin-text">Dusuk Stok</h2>
                  <p className="text-sm text-admin-muted">Dikkat gereken urunler</p>
                </div>
                <Link
                  href={paths.products}
                  className="rounded-lg border border-admin-border px-3 py-1.5 text-sm text-admin-text transition hover:border-admin-primary"
                >
                  Yonet
                </Link>
              </div>

              {stats.lowStockItems.length === 0 ? (
                <p className="py-8 text-sm text-admin-muted">Stok uyarisi yok.</p>
              ) : (
                <div className="space-y-3">
                  {stats.lowStockItems.map((product) => {
                    const thumb = safeMediaUrl(product.imageUrl);
                    const out = product.stock <= 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 rounded-xl border border-admin-border bg-admin-bg px-3 py-3"
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-admin-border bg-admin-surface-high">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-admin-muted">
                              Yok
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-admin-text">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-admin-muted">
                            {product.categoryName || 'Kategori yok'}
                          </p>
                        </div>
                        {out ? (
                          <span className="rounded-full bg-admin-danger/15 px-2.5 py-1 text-xs font-semibold text-admin-danger">
                            Tukendi
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-primary-container/25 text-xs font-bold text-admin-primary">
                            {product.stock}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
}

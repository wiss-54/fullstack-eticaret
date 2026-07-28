'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order, User } from '@/lib/types';
import {
  clearCustomerToken,
  customerGetMe,
  customerGetOrders,
  customerSaveShippingAddress,
} from '@/lib/customer-api';
import { orderStatusBadgeClass, orderStatusLabel } from '@/lib/order-status';
import { orderDetailPath, orderRef } from '@/lib/order-ref';
import { TR_CITIES, getDistrictsForCity } from '@/lib/tr-locations';
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

type TabKey = 'orders' | 'address' | 'profile';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'orders', label: 'Siparislerim' },
  { key: 'address', label: 'Adreslerim' },
  { key: 'profile', label: 'Profil' },
];

const POLL_MS = 12_000;

const fieldClass =
  'w-full rounded-lg border border-store-border bg-store-bg px-4 py-3 text-store-text outline-none ring-store-primary/20 focus:ring-2';

export default function AccountPageClient() {
  const ready = useCustomerGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: TabKey =
    tabParam === 'address' || tabParam === 'profile' || tabParam === 'orders'
      ? tabParam
      : 'orders';

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);

  const [shippingCity, setShippingCity] = useState('');
  const [shippingDistrict, setShippingDistrict] = useState('');
  const [shippingAddressLine, setShippingAddressLine] = useState('');
  const [phone, setPhone] = useState('');

  const districts = useMemo(
    () => (shippingCity ? getDistrictsForCity(shippingCity) : []),
    [shippingCity],
  );

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
          setShippingCity(profile.shippingCity ?? '');
          setShippingDistrict(profile.shippingDistrict ?? '');
          setShippingAddressLine(profile.shippingAddressLine ?? '');
          setPhone(profile.phone ?? '');
          if (!profile.shippingCity) setEditingAddress(true);
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
      if (document.visibilityState === 'visible') void loadOrders(true);
    };
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadOrders(true);
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

  function selectTab(next: TabKey) {
    const url = next === 'orders' ? '/hesabim' : `/hesabim?tab=${next}`;
    router.replace(url, { scroll: false });
  }

  async function handleSaveAddress(event: FormEvent) {
    event.preventDefault();
    setSavingAddress(true);
    setAddressMessage(null);
    try {
      const updated = await customerSaveShippingAddress({
        phone,
        shippingCity,
        shippingDistrict,
        shippingAddressLine,
      });
      setUser(updated);
      setEditingAddress(false);
      setAddressMessage('Adres kaydedildi.');
    } catch (err) {
      setAddressMessage(err instanceof Error ? err.message : 'Adres kaydedilemedi');
    } finally {
      setSavingAddress(false);
    }
  }

  if (!ready || loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
        <p className="text-store-muted">Yukleniyor...</p>
      </main>
    );
  }

  const hasAddress = Boolean(
    user?.shippingCity && user?.shippingDistrict && user?.shippingAddressLine,
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-10 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-store-border bg-store-surface p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] lg:sticky lg:top-24">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-store-muted">
            Hesabim
          </p>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {TABS.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => selectTab(item.key)}
                  className={`shrink-0 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition lg:flex lg:w-full lg:items-center ${
                    active
                      ? 'bg-store-primary-container text-store-on-primary'
                      : 'text-store-muted hover:bg-store-surface-low hover:text-store-text'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl border border-store-border px-3 py-2.5 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
          >
            Cikis Yap
          </button>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-store-primary-container text-lg font-bold text-store-on-primary">
                {initials(user?.fullName || 'U')}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold text-store-text">
                  Merhaba, {user?.fullName || 'Musteri'}
                </h1>
                <p className="truncate text-sm text-store-muted">{user?.email}</p>
              </div>
            </div>
          </section>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {tab === 'orders' ? (
            <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-store-text">Son Siparislerim</h2>
                  <p className="text-sm text-store-muted">Siparis durumunu buradan takip et</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadOrders()}
                  className="rounded-lg border border-store-border px-3 py-1.5 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
                >
                  Yenile
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-store-border bg-store-bg px-6 py-10 text-center">
                  <p className="text-store-muted">Henuz siparisiniz yok.</p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex rounded-lg bg-store-primary-container px-4 py-2.5 text-sm font-semibold text-store-on-primary transition hover:bg-store-primary"
                  >
                    Alisverise Basla
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <article
                      key={order.id}
                      className="flex flex-col gap-4 rounded-xl border border-store-border bg-store-bg p-4 transition hover:border-store-primary/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-store-text">#{orderRef(order)}</p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusBadgeClass(order.status)}`}
                          >
                            {orderStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-store-muted">{formatDate(order.createdAt)}</p>
                        <p className="mt-2 text-sm text-store-muted">
                          {(order.items?.length ?? 0) > 0
                            ? `${order.items?.[0]?.productName ?? 'Urun'}${
                                (order.items?.length ?? 0) > 1
                                  ? ` +${(order.items?.length ?? 0) - 1} urun`
                                  : ''
                              }`
                            : 'Urun kalemleri'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <p className="text-lg font-bold text-store-primary-container">
                          {formatPrice(order.total)}
                        </p>
                        <Link
                          href={orderDetailPath(order)}
                          className="text-sm font-semibold text-store-primary hover:underline"
                        >
                          Detay
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === 'address' ? (
            <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-store-text">Kayitli Adres</h2>
                  <p className="text-sm text-store-muted">Sonraki siparislerde otomatik dolar</p>
                </div>
                {hasAddress && !editingAddress ? (
                  <button
                    type="button"
                    onClick={() => setEditingAddress(true)}
                    className="rounded-lg border border-store-border px-3 py-1.5 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
                  >
                    Duzenle
                  </button>
                ) : null}
              </div>

              {!editingAddress && hasAddress ? (
                <div className="rounded-xl border border-store-border bg-store-bg p-4 text-sm text-store-muted">
                  <p className="font-semibold text-store-text">{user?.fullName}</p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {user?.shippingAddressLine}
                    {'\n'}
                    {user?.shippingDistrict} / {user?.shippingCity}
                  </p>
                  {user?.phone ? <p className="mt-2">{user.phone}</p> : null}
                </div>
              ) : (
                <form onSubmit={handleSaveAddress} className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold text-store-text">Telefon</span>
                    <input
                      className={fieldClass}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-store-text">Il</span>
                    <select
                      className={fieldClass}
                      value={shippingCity}
                      onChange={(e) => {
                        setShippingCity(e.target.value);
                        setShippingDistrict('');
                      }}
                      required
                    >
                      <option value="">Il Seciniz</option>
                      {TR_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-store-text">Ilce</span>
                    <select
                      className={fieldClass}
                      value={shippingDistrict}
                      onChange={(e) => setShippingDistrict(e.target.value)}
                      disabled={!shippingCity}
                      required
                    >
                      <option value="">{shippingCity ? 'Ilce Seciniz' : 'Once il secin'}</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold text-store-text">
                      Acik Adres
                    </span>
                    <textarea
                      className={`${fieldClass} min-h-24`}
                      value={shippingAddressLine}
                      onChange={(e) => setShippingAddressLine(e.target.value)}
                      required
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="rounded-lg bg-store-primary-container px-4 py-2.5 text-sm font-semibold text-store-on-primary disabled:opacity-60"
                    >
                      {savingAddress ? 'Kaydediliyor...' : 'Adresi Kaydet'}
                    </button>
                    {hasAddress ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(false);
                          setShippingCity(user?.shippingCity ?? '');
                          setShippingDistrict(user?.shippingDistrict ?? '');
                          setShippingAddressLine(user?.shippingAddressLine ?? '');
                          setPhone(user?.phone ?? '');
                        }}
                        className="rounded-lg border border-store-border px-4 py-2.5 text-sm text-store-muted"
                      >
                        Vazgec
                      </button>
                    ) : null}
                  </div>
                </form>
              )}

              {addressMessage ? (
                <p className="mt-4 text-sm text-store-primary">{addressMessage}</p>
              ) : null}
            </section>
          ) : null}

          {tab === 'profile' ? (
            <section className="rounded-2xl border border-store-border bg-store-surface p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-6">
              <h2 className="text-xl font-semibold text-store-text">Profil Bilgileri</h2>
              <p className="mt-1 text-sm text-store-muted">Hesap bilgilerin</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-store-border bg-store-bg p-4">
                  <p className="text-xs uppercase tracking-wide text-store-muted">Ad Soyad</p>
                  <p className="mt-1 font-semibold text-store-text">{user?.fullName}</p>
                </div>
                <div className="rounded-xl border border-store-border bg-store-bg p-4">
                  <p className="text-xs uppercase tracking-wide text-store-muted">E-posta</p>
                  <p className="mt-1 font-semibold text-store-text">{user?.email}</p>
                </div>
                <div className="rounded-xl border border-store-border bg-store-bg p-4">
                  <p className="text-xs uppercase tracking-wide text-store-muted">Telefon</p>
                  <p className="mt-1 font-semibold text-store-text">
                    {user?.phone || 'Belirtilmemis'}
                  </p>
                </div>
                <div className="rounded-xl border border-store-border bg-store-bg p-4">
                  <p className="text-xs uppercase tracking-wide text-store-muted">Uyelik</p>
                  <p className="mt-1 font-semibold text-store-text">
                    {user?.createdAt ? formatDate(user.createdAt) : '-'}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

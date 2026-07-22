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
  const linkValid = Number.isInteger(orderId) && orderId > 0 && token.length > 0;

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready || !linkValid) return;

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
  }, [ready, linkValid, orderId, token, router]);

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

  if (!ready) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <p className="text-store-muted">Odeme sayfasi yukleniyor...</p>
      </main>
    );
  }

  if (!linkValid) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <div className="rounded-xl bg-[#ffdad6] p-8">
          <p className="font-semibold text-[#93000a]">Gecersiz odeme baglantisi</p>
          <Link
            href="/odeme"
            className="mt-4 inline-block text-sm font-semibold text-store-primary hover:underline"
          >
            Odemeye don
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <p className="text-store-muted">Odeme sayfasi yukleniyor...</p>
      </main>
    );
  }

  if (provider === 'paytr') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <h1 className="mb-4 text-xl font-semibold text-store-text">PayTR Odeme</h1>
        <iframe
          title="PayTR"
          src={`https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}`}
          className="h-[720px] w-full rounded-xl border border-store-border bg-store-surface"
          frameBorder={0}
          scrolling="no"
        />
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <div className="rounded-xl bg-[#ffdad6] p-8">
          <p className="font-semibold text-[#93000a]">{error}</p>
          <Link
            href="/odeme"
            className="mt-4 inline-block text-sm font-semibold text-store-primary hover:underline"
          >
            Odemeye don
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 md:px-6">
      <div className="rounded-xl bg-store-surface p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-store-muted">
          PayTR on gosterim (mock)
        </p>
        <h1 className="mt-2 text-2xl font-bold text-store-text">Kart ile odeme</h1>
        <p className="mt-2 text-sm text-store-muted">
          PayTR merchant bilgileri henuz yok. Anahtarlar gelince ayni akis gercek PayTR iframe
          acacak.
        </p>

        {order ? (
          <div className="mt-6 space-y-3 rounded-lg bg-store-surface-low px-4 py-3">
            <div>
              <p className="text-sm text-store-muted">Siparis #{order.id}</p>
              <p className="mt-1 text-2xl font-bold text-store-primary-container">
                {formatPrice(order.total)}
              </p>
            </div>
            {(order.shippingCity || order.shippingAddress) && (
              <p className="text-sm text-store-muted">
                Teslimat:{' '}
                {order.shippingCity
                  ? `${order.shippingAddressLine ?? ''}, ${order.shippingDistrict} / ${order.shippingCity}`
                  : order.shippingAddress}
              </p>
            )}
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void complete(true)}
            className="flex-1 rounded-lg bg-store-primary-container px-4 py-3 text-sm font-semibold text-store-on-primary transition hover:bg-store-primary disabled:opacity-60"
          >
            {submitting ? 'Isleniyor...' : 'Odemeyi onayla (demo)'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void complete(false)}
            className="flex-1 rounded-lg border border-store-border px-4 py-3 text-sm font-semibold text-store-muted transition hover:border-store-primary hover:text-store-primary disabled:opacity-60"
          >
            Iptal et
          </button>
        </div>
      </div>
    </main>
  );
}

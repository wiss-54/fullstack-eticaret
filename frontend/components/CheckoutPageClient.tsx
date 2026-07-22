'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import CheckoutProgress from '@/components/CheckoutProgress';
import { customerCreateOrder, customerInitPayment } from '@/lib/customer-api';
import { TR_CITIES, getDistrictsForCity } from '@/lib/tr-locations';
import { useCustomerGuard } from '@/lib/use-customer-guard';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

type PaymentMethod = 'cod' | 'manual' | 'paytr';

const fieldClass =
  'w-full rounded-lg border border-store-border bg-store-surface px-4 py-3 text-store-text outline-none transition focus:border-store-primary-container focus:ring-2 focus:ring-store-primary-container/20 disabled:opacity-50';

const labelClass = 'mb-2 block text-sm font-semibold text-store-text';

export default function CheckoutPageClient() {
  const ready = useCustomerGuard('/giris?return=/odeme');
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [shippingCity, setShippingCity] = useState('');
  const [shippingDistrict, setShippingDistrict] = useState('');
  const [shippingAddressLine, setShippingAddressLine] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paytr');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const districts = useMemo(
    () => (shippingCity ? getDistrictsForCity(shippingCity) : []),
    [shippingCity],
  );

  if (!ready) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
        <p className="text-store-muted">Yukleniyor...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
        <div className="rounded-xl border border-dashed border-store-border bg-store-surface p-10 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-store-muted">Sepetin bos.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-store-primary-container px-5 py-3 text-sm font-semibold text-store-on-primary transition hover:bg-store-primary"
          >
            Alisverise Basla
          </Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const order = await customerCreateOrder({
        shippingCity,
        shippingDistrict,
        shippingAddressLine,
        customerPhone,
        orderNote: orderNote.trim() || undefined,
        paymentMethod,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          customerNote: item.customerNote || undefined,
        })),
      });

      if (paymentMethod === 'paytr') {
        const payment = await customerInitPayment(order.id);
        clearCart();
        window.location.href = payment.paymentPageUrl;
        return;
      }

      clearCart();
      router.push(`/hesabim/siparis/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Siparis olusturulamadi');
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = loading
    ? paymentMethod === 'paytr'
      ? 'Odemeye yonlendiriliyor...'
      : 'Siparis olusturuluyor...'
    : paymentMethod === 'paytr'
      ? 'Odemeyi Yap'
      : 'Siparisi Onayla';

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
      <CheckoutProgress active="checkout" />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-store-text">Odeme ve Teslimat</h1>
        <p className="mt-2 text-store-muted">
          Siparisinizi tamamlamak icin lutfen bilgilerinizi girin.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <form id="checkout-form" onSubmit={handleSubmit} className="flex-1 space-y-4">
          <section className="rounded-xl bg-store-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <h2 className="mb-6 text-xl font-semibold text-store-text">Teslimat Adresi</h2>
            <p className="mb-4 text-sm text-store-muted">
              Adres PayTR odemesine iletilir; kargo icin il / ilce ayri saklanir.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Il</span>
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
                <span className={labelClass}>Ilce</span>
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
                <span className={labelClass}>Acik Adres</span>
                <textarea
                  className={`${fieldClass} min-h-24 resize-none`}
                  value={shippingAddressLine}
                  onChange={(e) => setShippingAddressLine(e.target.value)}
                  placeholder="Mahalle, sokak, bina ve daire no vb."
                  required
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={labelClass}>Telefon</span>
                <input
                  className={fieldClass}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  required
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={labelClass}>Siparis notu (opsiyonel)</span>
                <textarea
                  className={`${fieldClass} min-h-20 resize-none`}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl bg-store-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <h2 className="mb-6 text-xl font-semibold text-store-text">Odeme Yontemi</h2>
            <div className="flex border-b border-store-border">
              {(
                [
                  { id: 'paytr' as const, label: 'Kredi / Banka Karti' },
                  { id: 'manual' as const, label: 'Havale / EFT' },
                  { id: 'cod' as const, label: 'Kapida Odeme' },
                ] as const
              ).map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex-1 py-3 text-center text-sm font-semibold transition ${
                    paymentMethod === method.id
                      ? 'border-b-2 border-store-primary text-store-primary'
                      : 'text-store-muted hover:text-store-primary'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
            {paymentMethod === 'paytr' ? (
              <p className="mt-4 rounded-lg bg-store-surface-low p-3 text-center text-sm text-store-primary">
                256-bit SSL ile guvenli kart odemesi (PayTR)
              </p>
            ) : (
              <p className="mt-4 text-sm text-store-muted">
                {paymentMethod === 'cod'
                  ? 'Kapida odeme ile siparisiniz olusturulur.'
                  : 'Havale / EFT siparisi manuel onay bekler.'}
              </p>
            )}
          </section>

          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-store-primary-container px-4 py-4 text-sm font-semibold text-store-on-primary transition hover:bg-store-primary disabled:opacity-60 lg:hidden"
          >
            {submitLabel}
          </button>
        </form>

        <aside className="h-fit w-full rounded-xl bg-store-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] lg:sticky lg:top-24 lg:w-96">
          <h3 className="mb-6 border-b border-store-border pb-4 text-xl font-semibold text-store-text">
            Siparis Ozeti
          </h3>
          <ul className="mb-6 space-y-4">
            {items.map((item) => (
              <li key={item.lineId} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold text-store-text">{item.name}</p>
                  <p className="text-store-muted">
                    {item.variantLabel ? `${item.variantLabel} · ` : ''}
                    {item.quantity} Adet
                  </p>
                </div>
                <p className="font-semibold text-store-text">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mb-6 space-y-3 border-b border-store-border pb-6 text-store-muted">
            <div className="flex justify-between">
              <span>Ara Toplam</span>
              <span className="font-medium text-store-text">{formatPrice(total)}</span>
            </div>
          </div>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xl font-semibold text-store-text">Toplam</span>
            <span className="text-xl font-bold text-store-primary-container">{formatPrice(total)}</span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="hidden w-full items-center justify-center gap-2 rounded-lg bg-store-primary-container px-4 py-4 text-sm font-semibold text-store-on-primary transition hover:bg-store-primary disabled:opacity-60 lg:flex"
          >
            {submitLabel}
          </button>
        </aside>
      </div>
    </main>
  );
}

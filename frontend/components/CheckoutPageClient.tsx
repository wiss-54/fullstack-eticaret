'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
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
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-zinc-500">Yukleniyor...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-10 text-center dark:border-amber-900/40 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-400">Sepetin bos.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-amber-800 px-4 py-2 text-sm text-white dark:bg-amber-500 dark:text-zinc-950"
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Teslimat Bilgileri</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Adres PayTR odemesine iletilir; kargo icin il / ilce ayri saklanir.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Il</span>
              <select
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={shippingCity}
                onChange={(e) => {
                  setShippingCity(e.target.value);
                  setShippingDistrict('');
                }}
                required
              >
                <option value="">Seciniz</option>
                {TR_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Ilce</span>
              <select
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900 disabled:opacity-50"
                value={shippingDistrict}
                onChange={(e) => setShippingDistrict(e.target.value)}
                disabled={!shippingCity}
                required
              >
                <option value="">{shippingCity ? 'Seciniz' : 'Once il secin'}</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
              Acik adres (mahalle, cadde, no, daire)
            </span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={shippingAddressLine}
              onChange={(e) => setShippingAddressLine(e.target.value)}
              placeholder="Ornek: Caferaga Mah. Moda Cad. No:12 D:3"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Telefon</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="05xx xxx xx xx"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
              Siparis notu (opsiyonel)
            </span>
            <textarea
              className="min-h-20 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">Odeme yontemi</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'paytr'}
                  onChange={() => setPaymentMethod('paytr')}
                />
                Kredi / banka karti (PayTR)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                Kapida odeme
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'manual'}
                  onChange={() => setPaymentMethod('manual')}
                />
                Havale / EFT (manuel onay)
              </label>
            </div>
            {paymentMethod === 'paytr' ? (
              <p className="mt-2 text-xs text-zinc-500">
                Su an on gosterim: PayTR anahtari yokken mock odeme ekrani acilir.
              </p>
            ) : null}
          </fieldset>

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-60 dark:bg-amber-500 dark:text-zinc-950"
          >
            {loading
              ? paymentMethod === 'paytr'
                ? 'Odemeye yonlendiriliyor...'
                : 'Siparis olusturuluyor...'
              : paymentMethod === 'paytr'
                ? 'Kart ile Ode'
                : 'Siparisi Onayla'}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Siparis Ozeti</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.lineId} className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">{item.name}</span>
                {item.variantLabel ? ` · ${item.variantLabel}` : ''} × {item.quantity}
                <span className="float-right">{formatPrice(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatPrice(total)}</p>
        </aside>
      </div>
    </main>
  );
}

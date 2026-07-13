'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { customerCreateOrder } from '@/lib/customer-api';
import { useCustomerGuard } from '@/lib/use-customer-guard';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

export default function CheckoutPageClient() {
  const ready = useCustomerGuard('/giris?return=/odeme');
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [shippingAddress, setShippingAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'manual'>('cod');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        shippingAddress,
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
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Teslimat Bilgileri</h2>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Adres</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Telefon</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Siparis notu (opsiyonel)</span>
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
            {loading ? 'Siparis olusturuluyor...' : 'Siparisi Onayla'}
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

'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

export default function CartPageClient() {
  const { items, total, setQuantity, removeItem, clearCart } = useCart();

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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-4">
          {items.map((item) => (
            <article
              key={item.lineId}
              className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-zinc-500">Gorsel yok</span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/urun/${item.productId}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatPrice(item.unitPrice)}
                      {item.unitPrice !== item.basePrice ? (
                        <span className="text-zinc-500"> (baz {formatPrice(item.basePrice)})</span>
                      ) : null}
                    </p>
                    {item.selectedOptions.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.selectedOptions.map((option) => (
                          <li key={`${item.lineId}-${option.optionId}`}>
                            {option.label}: {option.value}
                            {option.priceDelta > 0
                              ? ` (+${formatPrice(option.priceDelta)})`
                              : ''}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {item.customerNote ? (
                      <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                        Not: {item.customerNote}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.lineId)}
                    className="text-sm text-red-600 dark:text-red-300"
                  >
                    Sil
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.lineId, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg border border-zinc-300 dark:border-zinc-700"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.lineId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="h-8 w-8 rounded-lg border border-zinc-300 disabled:opacity-50 dark:border-zinc-700"
                  >
                    +
                  </button>
                  <span className="text-sm text-zinc-500">Stok: {item.stock}</span>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ozet</h2>
          <p className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatPrice(total)}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Odeme ve siparis kaydi bir sonraki guncellemede eklenecek.
          </p>
          <button
            type="button"
            disabled
            className="mt-6 w-full rounded-xl bg-amber-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-60 dark:bg-amber-500 dark:text-zinc-950"
          >
            Odemeye Gec (yakinda)
          </button>
          <button
            type="button"
            onClick={clearCart}
            className="mt-3 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700"
          >
            Sepeti Temizle
          </button>
          <Link
            href="/"
            className="mt-3 block text-center text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Alisverise devam et
          </Link>
        </aside>
      </div>
    </main>
  );
}

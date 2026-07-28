'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import CheckoutProgress from '@/components/CheckoutProgress';
import { safeMediaUrl } from '@/lib/safe-media-url';

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
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
        <h1 className="text-3xl font-bold text-store-text">Sepetim</h1>
        <div className="mt-8 rounded-xl border border-dashed border-store-border bg-store-surface p-10 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10">
      <CheckoutProgress active="cart" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-store-text">Sepetim</h1>
        <p className="mt-2 text-store-muted">
          Sepetinizde {items.length} urun bulunuyor.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <section className="flex flex-1 flex-col gap-4">
          {items.map((item) => {
            const imageSrc = safeMediaUrl(item.imageUrl);
            return (
              <article
                key={item.lineId}
                className="flex flex-col gap-6 rounded-xl bg-store-surface p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:flex-row sm:items-start"
              >
                <div className="h-32 w-full flex-shrink-0 overflow-hidden rounded-lg bg-store-surface-low sm:w-32">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageSrc} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-store-muted">
                      Gorsel yok
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between gap-4 sm:min-h-32">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/urun/${item.productId}`}
                        className="text-lg font-semibold text-store-text hover:text-store-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-store-muted">
                        {formatPrice(item.unitPrice)}
                        {item.unitPrice !== item.basePrice ? (
                          <span> (baz {formatPrice(item.basePrice)})</span>
                        ) : null}
                      </p>
                      {item.variantLabel ? (
                        <p className="mt-2 text-sm text-store-accent-text">
                          Varyant: {item.variantLabel}
                        </p>
                      ) : null}
                      {item.selectedOptions.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-store-muted">
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
                        <p className="mt-2 text-sm text-store-accent-text">
                          Not: {item.customerNote}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.lineId)}
                      className="rounded p-1 text-store-muted transition hover:text-red-600"
                      title="Kaldir"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="flex h-10 w-32 items-center justify-between rounded-lg border border-store-border px-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.lineId, item.quantity - 1)}
                        className="rounded p-1 text-store-muted transition hover:text-store-primary"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium text-store-text">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.lineId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="rounded p-1 text-store-muted transition hover:text-store-primary disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xl font-semibold text-store-primary-container">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="h-fit w-full rounded-xl bg-store-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] lg:w-96 lg:sticky lg:top-24">
          <h2 className="mb-6 text-xl font-semibold text-store-text">Siparis Ozeti</h2>
          <div className="mb-6 space-y-3">
            <div className="flex justify-between text-store-muted">
              <span>Ara Toplam</span>
              <span className="font-medium text-store-text">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-store-muted">
              <span>Kargo</span>
              <span className="font-medium text-store-primary">Ucretsiz*</span>
            </div>
            <div className="h-px bg-store-border" />
            <div className="flex justify-between">
              <span className="text-lg font-bold text-store-text">Toplam</span>
              <span className="text-2xl font-bold text-store-primary-container">
                {formatPrice(total)}
              </span>
            </div>
          </div>
          <p className="mb-6 text-sm text-store-muted">
            Siparisini tamamlamak icin giris yapman gerekiyor.
          </p>
          <Link
            href="/odeme"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-store-primary-container px-4 py-4 text-sm font-semibold text-store-on-primary transition hover:bg-store-primary"
          >
            Alisverisi Tamamla
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/"
            className="mt-3 block text-center text-sm font-semibold text-store-primary transition hover:underline"
          >
            Alisverise Devam Et
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="mt-3 w-full rounded-lg border border-store-border px-4 py-3 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
          >
            Sepeti Temizle
          </button>
          <p className="mt-4 flex items-center justify-center gap-1 text-xs text-store-muted">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Guvenli Odeme
          </p>
        </aside>
      </div>
    </main>
  );
}

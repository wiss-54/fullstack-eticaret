import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductPurchasePanel from '@/components/ProductPurchasePanel';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import { getProduct } from '@/lib/api';
import { safeMediaUrl } from '@/lib/safe-media-url';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId < 1) {
    notFound();
  }

  let product;
  try {
    product = await getProduct(productId);
  } catch {
    throw new Error('Ürün yüklenemedi');
  }

  if (!product) {
    notFound();
  }

  const hasOptions = (product.options?.length ?? 0) > 0;
  const imageSrc = safeMediaUrl(product.imageUrl);

  return (
    <div className="flex min-h-full flex-col bg-store-bg">
      <StoreHeader title={product.name} badge={`Stok: ${product.stock}`} />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-10 md:px-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-store-surface shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex min-h-96 items-center justify-center bg-store-surface-low">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-store-muted">Gorsel yok</span>
            )}
          </div>
        </div>

        <section className="rounded-lg bg-store-surface p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-store-accent-text">
            Urun detayi
          </p>
          <p className="mt-3 text-3xl font-bold text-store-primary">{formatPrice(product.price)}</p>
          <p className="mt-4 leading-relaxed text-store-muted">{product.description}</p>

          {hasOptions ? (
            <p className="mt-4 text-sm text-store-accent-text">
              Bu urun kisisellestirme secenekleri iceriyor.
            </p>
          ) : null}

          <div className="mt-8 space-y-4">
            <ProductPurchasePanel product={product} />
            <Link
              href="/"
              className="inline-block rounded border border-store-border px-5 py-3 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
            >
              Urunlere Don
            </Link>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

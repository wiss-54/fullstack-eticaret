import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductPurchasePanel from '@/components/ProductPurchasePanel';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import { getProduct } from '@/lib/api';

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

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title={product.name} badge={`Stok: ${product.stock}`} />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm dark:border-amber-900/30 dark:bg-zinc-950">
          <div className="flex min-h-96 items-center justify-center bg-gradient-to-br from-amber-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-zinc-500">Gorsel yok</span>
            )}
          </div>
        </div>

        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
            Urun detayi
          </p>
          <p className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatPrice(product.price)}
          </p>
          <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>

          {hasOptions ? (
            <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
              Bu urun kisisellestirme secenekleri iceriyor.
            </p>
          ) : null}

          <div className="mt-8 space-y-4">
            <ProductPurchasePanel product={product} />
            <Link
              href="/"
              className="inline-block rounded-xl border border-zinc-300 px-5 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
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

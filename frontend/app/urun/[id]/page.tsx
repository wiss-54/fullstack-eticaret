import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
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

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <StoreHeader title={product.name} badge={`Stok: ${product.stock}`} />

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex min-h-80 items-center justify-center bg-zinc-100 dark:bg-zinc-900">
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

        <section className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatPrice(product.price)}
          </p>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">{product.description}</p>

          <div className="mt-8 flex flex-wrap items-start gap-3">
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={product.price}
              imageUrl={product.imageUrl}
              stock={product.stock}
            />
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 px-5 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Urunlere Don
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

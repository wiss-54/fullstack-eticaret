import Link from 'next/link';
import type { Product } from '@/lib/types';

type ProductCardProps = {
  product: Product;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/urun/${product.id}`} className="block h-full">
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-40 items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm">Görsel yok</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {product.name}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatPrice(product.price)}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Stok: {product.stock}
          </span>
        </div>
      </div>
    </article>
    </Link>
  );
}

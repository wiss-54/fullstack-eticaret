import Link from 'next/link';
import type { Product } from '@/lib/types';
import { safeMediaUrl } from '@/lib/safe-media-url';

type ProductCardProps = {
  product: Product;
  /** false = editor onizleme; link calismaz */
  interactive?: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

export default function ProductCard({ product, interactive = true }: ProductCardProps) {
  const imageSrc = safeMediaUrl(product.imageUrl);

  const body = (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-amber-100/80 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-amber-900/30 dark:bg-zinc-950">
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-zinc-100 text-zinc-400 dark:from-zinc-900 dark:to-zinc-950 dark:text-zinc-600">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-sm">Gorsel yok</span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-amber-900 shadow-sm dark:bg-zinc-950/90 dark:text-amber-200">
          Stok: {product.stock}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{product.name}</h2>
          {product.categoryName ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
              {product.categoryName}
            </p>
          ) : null}
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-amber-900 dark:text-amber-200">
            {formatPrice(product.price)}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Incele
          </span>
        </div>
      </div>
    </article>
  );

  if (!interactive) {
    return <div className="block h-full cursor-default">{body}</div>;
  }

  return (
    <Link href={`/urun/${product.id}`} className="group block h-full">
      {body}
    </Link>
  );
}

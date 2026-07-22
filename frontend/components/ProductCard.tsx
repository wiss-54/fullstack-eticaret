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
    <article className="flex h-full flex-col overflow-hidden rounded-lg bg-store-surface shadow-[0px_4px_20px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)]">
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-store-surface-low text-store-muted">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="text-sm">Gorsel yok</span>
        )}
        <span className="absolute left-3 top-3 rounded bg-store-inverse px-2 py-1 text-xs font-medium text-store-inverse-text">
          Stok: {product.stock}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categoryName ? (
          <p className="text-xs font-medium uppercase tracking-wide text-store-accent-text">
            {product.categoryName}
          </p>
        ) : null}
        <h2 className="text-base font-semibold text-store-text">{product.name}</h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-store-muted">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-lg font-bold text-store-primary">{formatPrice(product.price)}</span>
          <span className="text-xs font-semibold text-store-muted transition group-hover:text-store-primary">
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

import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatStorePrice } from '@/lib/format-price';
import { safeMediaUrl } from '@/lib/safe-media-url';

type ProductCardProps = {
  product: Product;
  /** false = editor onizleme; link calismaz */
  interactive?: boolean;
  currencyCode?: string;
  currencyDecimals?: number;
};

export default function ProductCard({
  product,
  interactive = true,
  currencyCode = 'TRY',
  currencyDecimals = 2,
}: ProductCardProps) {
  const cover = product.imageUrls?.[0] ?? product.imageUrl;
  const imageSrc = safeMediaUrl(cover);
  const extraImages = Math.max(0, (product.imageUrls?.length ?? (product.imageUrl ? 1 : 0)) - 1);
  const hasVariants = product.productType === 'variant';

  const body = (
    <article className="group/card flex h-full flex-col overflow-hidden rounded-2xl bg-store-surface ring-1 ring-store-border/70 transition duration-300 hover:-translate-y-0.5 hover:ring-store-primary/35 hover:shadow-[0_18px_40px_rgba(26,28,28,0.08)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-store-surface-low">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover/card:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-store-surface-low via-store-bg to-store-surface-low">
            <span className="text-sm text-store-muted">Gorsel yok</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-store-text/45 via-transparent to-transparent opacity-80" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          {product.categoryName ? (
            <span className="rounded-full bg-store-surface/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-store-accent-text backdrop-blur-sm">
              {product.categoryName}
            </span>
          ) : (
            <span />
          )}
          {extraImages > 0 ? (
            <span className="rounded-full bg-store-inverse/80 px-2 py-1 text-[10px] font-medium text-store-inverse-text backdrop-blur-sm">
              +{extraImages} gorsel
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
        <div className="space-y-1">
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-store-text">
            {product.name}
          </h2>
          <p className="line-clamp-2 text-sm leading-relaxed text-store-muted">{product.description}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-store-border/60 pt-3">
          <div>
            {hasVariants ? (
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-store-muted">
                Secenekli
              </p>
            ) : null}
            <p className="text-xl font-bold tracking-tight text-store-primary">
              {formatStorePrice(product.price, { currencyCode, currencyDecimals })}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-store-primary-container/15 px-3 py-1.5 text-xs font-semibold text-store-primary transition group-hover/card:bg-store-primary-container group-hover/card:text-store-on-primary">
            Incele
            <span aria-hidden>→</span>
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

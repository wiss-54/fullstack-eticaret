import Link from 'next/link';
import { Suspense } from 'react';
import CartNav from '@/components/CartNav';
import CustomerNav from '@/components/CustomerNav';
import StoreHeaderNav from '@/components/StoreHeaderNav';
import StoreSearch from '@/components/StoreSearch';
import StoreThemeToggle from '@/components/StoreThemeToggle';
import type { Category } from '@/lib/types';
import { safeMediaUrl } from '@/lib/safe-media-url';

type StoreHeaderProps = {
  title?: string;
  subtitle?: string;
  badge?: string;
  logoUrl?: string | null;
  accentColor?: string;
  navItem1Label?: string;
  navItem1Href?: string;
  navItem2Label?: string;
  navItem2Href?: string;
  categories?: Category[];
  /** Editor canvas: no sticky overlay, no live nav actions */
  preview?: boolean;
};

export default function StoreHeader({
  title = 'Urunler',
  subtitle = 'EticaretShop',
  badge,
  logoUrl = null,
  navItem1Label = 'Kategoriler',
  navItem1Href = '/#kategoriler',
  navItem2Label = 'Koleksiyon',
  navItem2Href = '/#urunler',
  categories = [],
  preview = false,
}: StoreHeaderProps) {
  const logoSrc = safeMediaUrl(logoUrl);
  const brand = subtitle || 'EticaretShop';

  const brandBlock = (
    <>
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoSrc} alt={brand} className="h-10 w-10 rounded-full object-cover" />
      ) : null}
      <p className="truncate font-[family-name:var(--font-store-display,ui-serif)] text-2xl font-semibold tracking-tight text-store-text md:text-[1.75rem]">
        {brand}
      </p>
    </>
  );

  return (
    <header
      className={`border-b border-store-border bg-store-bg/95 backdrop-blur ${
        preview ? 'relative z-0' : 'sticky top-0 z-40'
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-10">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-4 md:py-5">
          <div className="justify-self-start">
            <Suspense
              fallback={
                <span className="inline-flex h-10 w-10 items-center justify-center text-store-muted">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3-3" />
                  </svg>
                </span>
              }
            >
              <StoreSearch preview={preview} />
            </Suspense>
          </div>

          <div className="justify-self-center">
            {preview ? (
              <div className="flex items-center gap-3">{brandBlock}</div>
            ) : (
              <Link href="/" className="flex items-center gap-3">
                {brandBlock}
              </Link>
            )}
          </div>

          <div className="flex items-center justify-self-end gap-1 sm:gap-2">
            {badge ? (
              <span className="hidden rounded bg-store-surface-low px-3 py-1 text-xs font-semibold text-store-accent-text md:inline">
                {badge}
              </span>
            ) : null}
            {preview ? (
              <>
                <span className="inline-flex h-10 w-10 items-center justify-center text-store-muted" aria-hidden>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 19a7 7 0 0 1 14 0" />
                  </svg>
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center text-store-muted" aria-hidden>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M6 8h12l-1 11H7L6 8Z" />
                    <path d="M9 8a3 3 0 0 1 6 0" />
                  </svg>
                </span>
              </>
            ) : (
              <>
                <StoreThemeToggle />
                <CustomerNav variant="icon" />
                <CartNav />
              </>
            )}
          </div>
        </div>

        <nav className="hidden items-center justify-center gap-8 border-t border-store-border/70 py-3 lg:flex">
          <StoreHeaderNav
            navItem1Label={navItem1Label}
            navItem1Href={navItem1Href}
            navItem2Label={navItem2Label}
            navItem2Href={navItem2Href}
            categories={categories}
            preview={preview}
          />
        </nav>

        <nav className="flex items-center justify-center gap-5 overflow-x-auto border-t border-store-border/70 py-3 text-sm lg:hidden">
          {preview ? (
            <>
              <span>Ana Sayfa</span>
              <span>Iletisim</span>
            </>
          ) : (
            <>
              <Link href="/" className="whitespace-nowrap text-store-text hover:text-store-primary">
                Ana Sayfa
              </Link>
              <a
                href={navItem2Href || '/#urunler'}
                className="whitespace-nowrap text-store-text hover:text-store-primary"
              >
                Tum Urunler
              </a>
              <Link href="/iletisim" className="whitespace-nowrap text-store-text hover:text-store-primary">
                Iletisim
              </Link>
            </>
          )}
        </nav>
      </div>
      {title && title !== brand && title !== 'Urunler' && title !== 'Magazamiz' ? (
        <p className="sr-only">{title}</p>
      ) : null}
    </header>
  );
}

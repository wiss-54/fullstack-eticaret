import Link from 'next/link';
import CartNav from '@/components/CartNav';
import CustomerNav from '@/components/CustomerNav';
import StoreThemeToggle from '@/components/StoreThemeToggle';
import { safeHref } from '@/lib/safe-href';
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
  preview = false,
}: StoreHeaderProps) {
  const logoSrc = safeMediaUrl(logoUrl);
  const brand = subtitle || 'EticaretShop';
  const link1Href = safeHref(navItem1Href, '/#kategoriler');
  const link2Href = safeHref(navItem2Href, '/#urunler');

  const brandBlock = (
    <>
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoSrc} alt={brand} className="h-10 w-10 rounded object-cover" />
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-xl font-bold tracking-tight text-store-primary md:text-2xl">
          {brand}
        </p>
        {title && title !== brand ? (
          <p className="truncate text-xs text-store-muted md:text-sm">{title}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <header
      className={`border-b border-store-border bg-store-bg/95 backdrop-blur ${
        preview ? 'relative z-0' : 'sticky top-0 z-40'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-10">
        {preview ? (
          <div className="flex min-w-0 items-center gap-3">{brandBlock}</div>
        ) : (
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {brandBlock}
          </Link>
        )}

        <nav className="hidden items-center gap-6 text-sm font-semibold text-store-muted lg:flex">
          {preview ? (
            <>
              <span>{navItem1Label}</span>
              <span>{navItem2Label}</span>
            </>
          ) : (
            <>
              <a href={link1Href} className="transition hover:text-store-primary">
                {navItem1Label}
              </a>
              <a href={link2Href} className="transition hover:text-store-primary">
                {navItem2Label}
              </a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {badge ? (
            <span className="hidden rounded bg-store-surface-low px-3 py-1 text-xs font-semibold text-store-accent-text sm:inline">
              {badge}
            </span>
          ) : null}
          {preview ? (
            <span className="rounded-lg border border-store-border px-2.5 py-2 text-xs text-store-muted">
              Hesabim
            </span>
          ) : (
            <>
              <StoreThemeToggle />
              <CartNav />
              <CustomerNav />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

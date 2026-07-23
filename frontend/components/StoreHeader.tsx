import Link from 'next/link';
import CartNav from '@/components/CartNav';
import CustomerNav from '@/components/CustomerNav';
import StoreThemeToggle from '@/components/StoreThemeToggle';
import { safeMediaUrl } from '@/lib/safe-media-url';

type StoreHeaderProps = {
  title?: string;
  subtitle?: string;
  badge?: string;
  logoUrl?: string | null;
  accentColor?: string;
};

export default function StoreHeader({
  title = 'Urunler',
  subtitle = 'EticaretShop',
  badge,
  logoUrl = null,
  accentColor = '#855300',
}: StoreHeaderProps) {
  const logoSrc = safeMediaUrl(logoUrl);
  const brand = subtitle || 'EticaretShop';

  return (
    <header className="sticky top-0 z-40 border-b border-store-border bg-store-bg/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={brand} className="h-10 w-10 rounded object-cover" />
          ) : null}
          <div className="min-w-0">
            <p
              className="truncate text-xl font-bold tracking-tight md:text-2xl"
              style={{ color: accentColor }}
            >
              {brand}
            </p>
            {title && title !== brand ? (
              <p className="truncate text-xs text-store-muted md:text-sm">{title}</p>
            ) : null}
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-store-muted lg:flex">
          <a href="#urunler" className="transition hover:text-store-primary">
            Kategoriler
          </a>
          <a href="#urunler" className="transition hover:text-store-primary">
            Koleksiyon
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {badge ? (
            <span
              className="hidden rounded px-3 py-1 text-xs font-semibold sm:inline"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              {badge}
            </span>
          ) : null}
          <StoreThemeToggle />
          <CartNav />
          <CustomerNav />
        </div>
      </div>
    </header>
  );
}

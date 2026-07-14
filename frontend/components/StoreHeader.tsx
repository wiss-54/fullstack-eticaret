import Link from 'next/link';
import CartNav from '@/components/CartNav';
import CustomerNav from '@/components/CustomerNav';
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
  subtitle = 'Hatira Niyat',
  badge,
  logoUrl = null,
  accentColor = '#92400e',
}: StoreHeaderProps) {
  const logoSrc = safeMediaUrl(logoUrl);

  return (
    <header className="sticky top-0 z-40 border-b border-amber-100/80 bg-white/90 backdrop-blur dark:border-amber-900/30 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={subtitle} className="h-10 w-10 rounded-lg object-cover" />
          ) : null}
          <div>
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.18em]"
              style={{ color: accentColor }}
            >
              {subtitle}
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge ? (
            <span
              className="hidden rounded-full px-3 py-1 text-sm sm:inline"
              style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
            >
              {badge}
            </span>
          ) : null}
          <CartNav />
          <CustomerNav />
        </div>
      </div>
    </header>
  );
}

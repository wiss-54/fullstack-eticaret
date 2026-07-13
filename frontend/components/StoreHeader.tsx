import Link from 'next/link';
import CartNav from '@/components/CartNav';
import CustomerNav from '@/components/CustomerNav';

type StoreHeaderProps = {
  title?: string;
  subtitle?: string;
  badge?: string;
};

export default function StoreHeader({
  title = 'Urunler',
  subtitle = 'Hatira Niyat',
  badge,
}: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-100/80 bg-white/90 backdrop-blur dark:border-amber-900/30 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300"
          >
            {subtitle}
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {badge ? (
            <span className="hidden rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200 sm:inline">
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

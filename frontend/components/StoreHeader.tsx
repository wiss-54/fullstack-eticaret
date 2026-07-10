import Link from 'next/link';

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
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-700">
            {subtitle}
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
        </div>
        {badge ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {badge}
          </span>
        ) : null}
      </div>
    </header>
  );
}

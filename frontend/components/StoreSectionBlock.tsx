import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import type { Category, Product, StoreSection, StoreSettings } from '@/lib/types';
import { getButtonRadiusClass, getCardRadiusClass } from '@/lib/store-theme';

type Props = {
  section: StoreSection;
  settings: StoreSettings;
  products: Product[];
  categories: Category[];
  activeCategoryId?: number;
  error: string | null;
};

export default function StoreSectionBlock({
  section,
  settings,
  products,
  categories,
  activeCategoryId,
  error,
}: Props) {
  if (!section.enabled) return null;

  const accent = settings.accentColor;
  const btn = getButtonRadiusClass(settings);
  const card = getCardRadiusClass(settings);

  if (section.type === 'features') {
    const features = settings.featureCards ?? [];
    if (features.length === 0) return null;
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div
              key={`${item.title}-${item.text}`}
              className={`${card} border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950`}
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === 'products') {
    return (
      <section id="urunler" className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              {settings.productsEyebrow}
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {settings.productsTitle}
            </h2>
          </div>
          <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {settings.productsSubtitle}
          </p>
        </div>

        <CategoryFilter categories={categories} activeCategoryId={activeCategoryId} />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className={`${card} border border-dashed border-amber-200 bg-white p-12 text-center dark:border-amber-900/40 dark:bg-zinc-950`}>
            <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">Henuz urun yok</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    );
  }

  if (section.type === 'rich_text') {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div
          className={`${card} border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950 ${
            section.align === 'center' ? 'text-center' : ''
          }`}
        >
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{section.title}</h2>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-zinc-600 dark:text-zinc-400">
            {section.body}
          </p>
        </div>
      </section>
    );
  }

  if (section.type === 'banner') {
    const tone = section.tone ?? 'accent';
    const style =
      tone === 'dark'
        ? { backgroundColor: '#111827', color: '#fff' }
        : tone === 'muted'
          ? { backgroundColor: '#f4f4f5', color: '#18181b' }
          : { backgroundColor: `${accent}18`, color: accent };

    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className={`${card} flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`} style={style}>
          <div>
            <h3 className="text-xl font-semibold">{section.title}</h3>
            <p className="mt-1 text-sm opacity-90">{section.body}</p>
          </div>
          {section.ctaLabel && section.ctaHref ? (
            <Link
              href={section.ctaHref}
              className={`${btn} px-5 py-2 text-sm font-semibold`}
              style={
                tone === 'dark'
                  ? { backgroundColor: '#fff', color: '#111827' }
                  : { backgroundColor: accent, color: '#fff' }
              }
            >
              {section.ctaLabel}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  if (section.type === 'cta') {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div
          className={`${card} border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950`}
        >
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{section.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">{section.body}</p>
          <Link
            href={section.ctaHref}
            className={`${btn} mt-6 inline-block px-6 py-3 text-sm font-semibold text-white`}
            style={{ backgroundColor: accent }}
          >
            {section.ctaLabel}
          </Link>
        </div>
      </section>
    );
  }

  return null;
}

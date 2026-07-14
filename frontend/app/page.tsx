import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import StoreHero from '@/components/StoreHero';
import { getCategories, getProducts, getStoreSettings } from '@/lib/api';
import type { Category, Product, StoreSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

type HomeProps = {
  searchParams: Promise<{ category?: string }>;
};

const FALLBACK_SETTINGS: StoreSettings = {
  brandName: 'Hatira Niyat',
  logoUrl: null,
  accentColor: '#92400e',
  heroEyebrow: 'Hatira Niyat',
  heroTitle: 'Ozel anlarina ozel urunler',
  heroSubtitle: 'Kişiselleştirilebilir seçenekler, sipariş notu ve güvenli alışveriş.',
  heroCtaLabel: 'Urunleri Kesfet',
  heroCtaHref: '#urunler',
  heroSecondaryCtaLabel: 'Sepetime Git',
  heroSecondaryCtaHref: '/sepet',
  featureCards: [],
  productsEyebrow: 'Koleksiyon',
  productsTitle: 'One cikan urunler',
  productsSubtitle:
    'Varyantli urunlerde beden/renk bazli stok, kategoriler ve kisisellestirme alanlari desteklenir.',
  footerLeft: 'Hatira Niyat. Tum haklari saklidir.',
  footerRight: 'Guvenli odeme ve kisisellestirme altyapisi gelistiriliyor.',
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const categoryId = params.category ? Number(params.category) : undefined;
  const activeCategoryId =
    categoryId && Number.isInteger(categoryId) && categoryId > 0 ? categoryId : undefined;

  let products: Product[] = [];
  let categories: Category[] = [];
  let settings: StoreSettings = FALLBACK_SETTINGS;
  let error: string | null = null;

  try {
    [products, categories, settings] = await Promise.all([
      getProducts(activeCategoryId),
      getCategories(),
      getStoreSettings(),
    ]);
  } catch {
    error = 'Ürünler yüklenemedi. Backend çalışıyor mu kontrol et.';
    try {
      settings = await getStoreSettings();
    } catch {
      settings = FALLBACK_SETTINGS;
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader
        title="Magazamiz"
        subtitle={settings.brandName}
        badge={`${products.length} urun`}
        logoUrl={settings.logoUrl}
        accentColor={settings.accentColor}
      />
      <StoreHero settings={settings} />

      <main id="urunler" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.18em]"
              style={{ color: settings.accentColor }}
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
          <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-12 text-center dark:border-amber-900/40 dark:bg-zinc-950">
            <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">Henuz urun yok</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Admin panelden urun ekleyince burada gorunecek.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <StoreFooter
        brandName={settings.brandName}
        leftText={settings.footerLeft}
        rightText={settings.footerRight}
      />
    </div>
  );
}

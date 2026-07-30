import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import StoreHero from '@/components/StoreHero';
import StoreSectionBlock from '@/components/StoreSectionBlock';
import { getCategories, getProducts, getStoreSettings } from '@/lib/api';
import { getStoreShellClass } from '@/lib/store-theme';
import type { Category, Product, StoreSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

type HomeProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

const FALLBACK_SETTINGS: StoreSettings = {
  brandName: 'EticaretShop',
  logoUrl: null,
  accentColor: '#855300',
  themeId: 'classic-amber',
  surfaceStyle: 'warm',
  radiusStyle: 'rounded',
  buttonStyle: 'pill',
  heroLayout: 'split',
  fontStyle: 'classic',
  heroEyebrow: 'EticaretShop',
  heroTitle: 'Ozel anlarina ozel urunler',
  heroSubtitle: 'Beden veya renk secenekleri, siparis notu ve guvenli alisveris.',
  heroCtaLabel: 'Urunleri Kesfet',
  heroCtaHref: '#urunler',
  heroSecondaryCtaLabel: 'Sepetime Git',
  heroSecondaryCtaHref: '/sepet',
  featureCards: [],
  productsEyebrow: 'Koleksiyon',
  productsTitle: 'One cikan urunler',
  productsSubtitle:
    'Varyantli urunlerde beden veya renk secenekleri ve kategoriler desteklenir.',
  navItem1Label: 'Kategoriler',
  navItem1Href: '/#kategoriler',
  navItem2Label: 'Koleksiyon',
  navItem2Href: '/#urunler',
  footerLeft: 'EticaretShop. Tum haklari saklidir.',
  footerRight: 'Guvenli odeme altyapisi.',
  currencyCode: 'TRY',
  currencyDecimals: 2,
  sections: [
    { id: 'hero', type: 'hero', enabled: true },
    { id: 'features', type: 'features', enabled: true },
    { id: 'products', type: 'products', enabled: true },
  ],
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const categoryId = params.category ? Number(params.category) : undefined;
  const activeCategoryId =
    categoryId && Number.isInteger(categoryId) && categoryId > 0 ? categoryId : undefined;
  const query = params.q?.trim().toLowerCase() ?? '';

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

  if (query) {
    products = products.filter((product) => {
      const haystack = `${product.name} ${product.description} ${product.categoryName ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  const sections =
    settings.sections?.length > 0 ? settings.sections : FALLBACK_SETTINGS.sections;

  return (
    <div className={`flex min-h-full flex-col ${getStoreShellClass(settings)}`}>
      <StoreHeader
        title="Magazamiz"
        subtitle={settings.brandName}
        logoUrl={settings.logoUrl}
        accentColor={settings.accentColor}
        navItem1Label={settings.navItem1Label}
        navItem1Href={settings.navItem1Href}
        navItem2Label={settings.navItem2Label}
        navItem2Href={settings.navItem2Href}
        categories={categories}
      />

      {sections.map((section) => {
        if (!section.enabled) return null;
        if (section.type === 'hero') {
          return <StoreHero key={section.id} settings={settings} />;
        }
        return (
          <StoreSectionBlock
            key={section.id}
            section={section}
            settings={settings}
            products={products}
            categories={categories}
            activeCategoryId={activeCategoryId}
            error={error}
          />
        );
      })}

      <StoreFooter
        brandName={settings.brandName}
        logoUrl={settings.logoUrl}
        leftText={settings.footerLeft}
        rightText={settings.footerRight}
        navItem2Href={settings.navItem2Href}
      />
    </div>
  );
}

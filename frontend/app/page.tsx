import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import StoreHero from '@/components/StoreHero';
import StoreSectionBlock from '@/components/StoreSectionBlock';
import { getCategories, getProducts, getStoreSettings } from '@/lib/api';
import { getStoreShellClass } from '@/lib/store-theme';
import type { Category, Product, StoreSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

type HomeProps = {
  searchParams: Promise<{ category?: string }>;
};

const FALLBACK_SETTINGS: StoreSettings = {
  brandName: 'EticaretShop',
  logoUrl: null,
  accentColor: '#92400e',
  themeId: 'classic-amber',
  surfaceStyle: 'warm',
  radiusStyle: 'rounded',
  buttonStyle: 'pill',
  heroLayout: 'split',
  fontStyle: 'classic',
  heroEyebrow: 'EticaretShop',
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
  footerLeft: 'EticaretShop. Tum haklari saklidir.',
  footerRight: 'Guvenli odeme ve kisisellestirme altyapisi gelistiriliyor.',
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

  const sections =
    settings.sections?.length > 0 ? settings.sections : FALLBACK_SETTINGS.sections;

  return (
    <div className={`flex min-h-full flex-col ${getStoreShellClass(settings)}`}>
      <StoreHeader
        title="Magazamiz"
        subtitle={settings.brandName}
        badge={`${products.length} urun`}
        logoUrl={settings.logoUrl}
        accentColor={settings.accentColor}
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
        leftText={settings.footerLeft}
        rightText={settings.footerRight}
      />
    </div>
  );
}

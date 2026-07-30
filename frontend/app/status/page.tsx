import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import PublicStatusClient from '@/components/PublicStatusClient';
import { getCategories, getStoreSettings } from '@/lib/api';
import { getStoreShellClass } from '@/lib/store-theme';
import type { Category, StoreSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
  heroTitle: '',
  heroSubtitle: '',
  heroCtaLabel: '',
  heroCtaHref: '#urunler',
  heroSecondaryCtaLabel: '',
  heroSecondaryCtaHref: '/sepet',
  featureCards: [],
  productsEyebrow: '',
  productsTitle: '',
  productsSubtitle: '',
  navItem1Label: 'Kategoriler',
  navItem1Href: '/#kategoriler',
  navItem2Label: 'Koleksiyon',
  navItem2Href: '/#urunler',
  footerLeft: 'EticaretShop. Tum haklari saklidir.',
  footerRight: 'Guvenli odeme altyapisi.',
  currencyCode: 'TRY',
  currencyDecimals: 2,
  sections: [],
};

export default async function StatusPage() {
  let settings: StoreSettings = FALLBACK_SETTINGS;
  let categories: Category[] = [];
  try {
    [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  } catch {
    settings = FALLBACK_SETTINGS;
  }

  return (
    <div className={`flex min-h-full flex-col ${getStoreShellClass(settings)}`}>
      <StoreHeader
        subtitle={settings.brandName}
        logoUrl={settings.logoUrl}
        accentColor={settings.accentColor}
        navItem1Label={settings.navItem1Label}
        navItem1Href={settings.navItem1Href}
        navItem2Label={settings.navItem2Label}
        navItem2Href={settings.navItem2Href}
        categories={categories}
      />
      <main className="flex-1">
        <PublicStatusClient />
      </main>
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

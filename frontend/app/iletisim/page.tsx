import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import ContactForm from '@/components/ContactForm';
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

export default async function ContactPage() {
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

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-14 md:px-10 md:py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-store-text md:text-5xl">
            Iletisime Gec
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[11px] font-semibold uppercase leading-relaxed tracking-[0.14em] text-store-muted md:text-xs">
            Bir sorunuz veya yorumunuz mu var? Cekinmeyin: ulasin ve merhaba deyin! Destek
            saatleri: Pazartesi-Cuma, 08:00-18:00
          </p>
        </div>

        <div className="mt-12 md:mt-16">
          <ContactForm />
        </div>
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

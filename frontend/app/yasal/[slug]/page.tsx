import Link from 'next/link';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import { getCategories, getStoreSettings } from '@/lib/api';
import { getStoreShellClass } from '@/lib/store-theme';
import type { Category, StoreSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

type LegalSlug =
  | 'gizlilik'
  | 'iade'
  | 'hizmet-sartlari'
  | 'bildirim'
  | 'kargo';

const CONTENT: Record<
  LegalSlug,
  { title: string; paragraphs: string[] }
> = {
  gizlilik: {
    title: 'Gizlilik politikasi',
    paragraphs: [
      'EticaretShop olarak kisisel verilerinizi yalnizca siparis, destek ve yasal yukumlulukler icin isleriz.',
      'Odeme bilgileri guvenli odeme altyapisi uzerinden islenir; kart verileri sunucularimizda saklanmaz.',
      'Haklariniz veya veri talepleriniz icin iletisim formumuzdan bize ulasabilirsiniz.',
    ],
  },
  iade: {
    title: 'Para iade politikasi',
    paragraphs: [
      'Cayma hakki kapsamindaki iade taleplerini siparis tesliminden sonra yasal sure icinde iletebilirsiniz.',
      'Urunun kullanilmamis ve yeniden satilabilir durumda olmasi beklenir; kisilestirilmis urunlerde istisnalar uygulanabilir.',
      'Onaylanan iadeler, odemenin yapildigi yontemle iade edilir.',
    ],
  },
  'hizmet-sartlari': {
    title: 'Hizmet sartlari',
    paragraphs: [
      'Siteyi kullanarak magaza kurallarini ve siparis kosullarini kabul etmis olursunuz.',
      'Fiyatlar, stok ve kampanyalar onceden bildirim olmaksizin guncellenebilir.',
      'Kotuye kullanim, sahte siparis veya dolandiricilik girisimlerinde siparis iptal edilebilir.',
    ],
  },
  bildirim: {
    title: 'Yasal bildirim',
    paragraphs: [
      'Bu sitedeki marka, metin ve gorseller EticaretShop veya lisans verenlerine aittir.',
      'Iceriklerin izinsiz kopyalanmasi, dagitilmasi veya ticari kullanimi yasaktir.',
      'Hukuki bildirimler icin iletisim kanallarimizi kullanabilirsiniz.',
    ],
  },
  kargo: {
    title: 'Kargo politikasi',
    paragraphs: [
      'Siparisler stok durumuna gore hazirlanir ve anlasmali kargo firmasiyla gonderilir.',
      'Teslimat suresi bolgeye ve kargo yogunluguna gore degisebilir.',
      'Adres veya alici bilgisi hatalarindan kaynaklanan gecikmelerde destek ekibimize yazin.',
    ],
  },
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
  heroEyebrow: '',
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
  footerLeft: 'Sevdiklerine en ozel urunler.',
  footerRight: 'Sorulariniz veya yorumlariniz mi var? Bize yazin, yardimci olmak isteriz.',
  currencyCode: 'TRY',
  currencyDecimals: 2,
  sections: [],
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = CONTENT[slug as LegalSlug];

  let settings: StoreSettings = FALLBACK_SETTINGS;
  let categories: Category[] = [];
  try {
    [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  } catch {
    settings = FALLBACK_SETTINGS;
  }

  if (!doc) {
    return (
      <div className={`flex min-h-full flex-col ${getStoreShellClass(settings)}`}>
        <StoreHeader
          subtitle={settings.brandName}
          logoUrl={settings.logoUrl}
          categories={categories}
          navItem1Label={settings.navItem1Label}
          navItem1Href={settings.navItem1Href}
          navItem2Label={settings.navItem2Label}
          navItem2Href={settings.navItem2Href}
        />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-16 md:px-10">
          <h1 className="text-3xl font-bold text-store-text">Sayfa bulunamadi</h1>
          <Link href="/" className="mt-6 text-store-primary underline">
            Ana sayfaya don
          </Link>
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

  return (
    <div className={`flex min-h-full flex-col ${getStoreShellClass(settings)}`}>
      <StoreHeader
        subtitle={settings.brandName}
        logoUrl={settings.logoUrl}
        categories={categories}
        navItem1Label={settings.navItem1Label}
        navItem1Href={settings.navItem1Href}
        navItem2Label={settings.navItem2Label}
        navItem2Href={settings.navItem2Href}
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-14 md:px-10 md:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-store-text md:text-4xl">
          {doc.title}
        </h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-store-muted md:text-base">
          {doc.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link href="/iletisim" className="mt-10 text-sm font-semibold text-store-primary underline">
          Iletisime gec
        </Link>
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

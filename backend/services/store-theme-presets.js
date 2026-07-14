const DEFAULT_FEATURES = [
  { title: 'Kisisellestirme', text: 'Her urune ozel secenekler ve not alani' },
  { title: 'Guvenli Siparis', text: 'Stok ve secenek kontrolu otomatik' },
  { title: 'Hizli Yonetim', text: 'Admin panelden urun ve secenek yonetimi' },
  { title: 'Canli Takip', text: 'Monitoring ile sistem durumu izleme' },
];

const DEFAULT_SECTIONS = [
  { id: 'hero', type: 'hero', enabled: true },
  { id: 'features', type: 'features', enabled: true },
  { id: 'products', type: 'products', enabled: true },
];

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const THEME_PRESETS = [
  {
    id: 'classic-amber',
    name: 'Klasik Amber',
    description: 'Sicak amber tonlari, bol kartli klasik vitrin.',
    previewAccent: '#92400e',
    settings: {
      themeId: 'classic-amber',
      accentColor: '#92400e',
      surfaceStyle: 'warm',
      radiusStyle: 'rounded',
      buttonStyle: 'pill',
      heroLayout: 'split',
      fontStyle: 'classic',
      heroEyebrow: 'Hatira Niyat',
      heroTitle: 'Ozel anlarina ozel urunler',
      heroSubtitle:
        'Kişiselleştirilebilir seçenekler, sipariş notu ve güvenli alışveriş.',
      heroCtaLabel: 'Urunleri Kesfet',
      heroCtaHref: '#urunler',
      heroSecondaryCtaLabel: 'Sepetime Git',
      heroSecondaryCtaHref: '/sepet',
      featureCards: DEFAULT_FEATURES,
      productsEyebrow: 'Koleksiyon',
      productsTitle: 'One cikan urunler',
      productsSubtitle:
        'Varyantli urunlerde beden/renk bazli stok, kategoriler ve kisisellestirme alanlari desteklenir.',
      sections: [
        { id: 'hero', type: 'hero', enabled: true },
        { id: 'features', type: 'features', enabled: true },
        { id: 'products', type: 'products', enabled: true },
      ],
    },
  },
  {
    id: 'modern-slate',
    name: 'Modern Slate',
    description: 'Sade gri-mavi, ortali hero ve keskin hatlar.',
    previewAccent: '#334155',
    settings: {
      themeId: 'modern-slate',
      accentColor: '#334155',
      surfaceStyle: 'cool',
      radiusStyle: 'sharp',
      buttonStyle: 'square',
      heroLayout: 'centered',
      fontStyle: 'modern',
      heroEyebrow: 'Yeni Sezon',
      heroTitle: 'Sade tasarim, guclu deneyim',
      heroSubtitle: 'Minimal vitrin. Urunlerin kendini gostersin.',
      heroCtaLabel: 'Koleksiyona Bak',
      heroCtaHref: '#urunler',
      heroSecondaryCtaLabel: 'Sepet',
      heroSecondaryCtaHref: '/sepet',
      featureCards: [
        { title: 'Hizli Secim', text: 'Az dikkat daginikligi, net karar' },
        { title: 'Temiz Katalog', text: 'Urun odakli modern grid' },
        { title: 'Net CTA', text: 'Tek tikla alisverise gecis' },
      ],
      productsEyebrow: 'Katalog',
      productsTitle: 'Secili urunler',
      productsSubtitle: 'Sade liste, guclu stok ve varyant destegi.',
      sections: [
        { id: 'hero', type: 'hero', enabled: true },
        {
          id: 'banner-slate',
          type: 'banner',
          enabled: true,
          title: 'Ucretsiz kargo firsati',
          body: 'Belirli tutarin uzerindeki siparislerde gecerli.',
          ctaLabel: 'Alisverise Basla',
          ctaHref: '#urunler',
          tone: 'muted',
        },
        { id: 'products', type: 'products', enabled: true },
        { id: 'features', type: 'features', enabled: true },
      ],
    },
  },
  {
    id: 'soft-blush',
    name: 'Soft Blush',
    description: 'Butik hissi, yumusak pembe ve zarif tipografi.',
    previewAccent: '#9f1239',
    settings: {
      themeId: 'soft-blush',
      accentColor: '#9f1239',
      surfaceStyle: 'soft',
      radiusStyle: 'soft',
      buttonStyle: 'pill',
      heroLayout: 'split',
      fontStyle: 'elegant',
      heroEyebrow: 'El yapimi dokunus',
      heroTitle: 'Her hediye bir hikaye',
      heroSubtitle: 'Kisisel notlar, secenekler ve ozenli paketleme ile.',
      heroCtaLabel: 'Hediyeleri Gor',
      heroCtaHref: '#urunler',
      heroSecondaryCtaLabel: 'Sepetim',
      heroSecondaryCtaHref: '/sepet',
      featureCards: [
        { title: 'Kisisel Not', text: 'Siparisine ozel mesaj birak' },
        { title: 'Secenekler', text: 'Renk, yazi ve ekstra dokunuslar' },
        { title: 'Ozenli Teslimat', text: 'Hediye sunumuna uygun hazirlik' },
      ],
      productsEyebrow: 'Vitrin',
      productsTitle: 'Butik urunler',
      productsSubtitle: 'Sicak tonlar ve yumuşak gezinme deneyimi.',
      sections: [
        { id: 'hero', type: 'hero', enabled: true },
        { id: 'features', type: 'features', enabled: true },
        {
          id: 'rich-blush',
          type: 'rich_text',
          enabled: true,
          title: 'Neden biz?',
          body: 'Her urunu ozel gunlere gore dusunuyoruz. Not alanlari ve varyantlarla hediyeni sen tasarliyorsun.',
          align: 'center',
        },
        { id: 'products', type: 'products', enabled: true },
      ],
    },
  },
  {
    id: 'bold-ink',
    name: 'Bold Ink',
    description: 'Kontrastli editorial vitrin, guclu CTA alanlari.',
    previewAccent: '#111827',
    settings: {
      themeId: 'bold-ink',
      accentColor: '#111827',
      surfaceStyle: 'contrast',
      radiusStyle: 'sharp',
      buttonStyle: 'rounded',
      heroLayout: 'minimal',
      fontStyle: 'modern',
      heroEyebrow: 'Limited',
      heroTitle: 'Guclu vitrin. Net mesaj.',
      heroSubtitle: 'Editorial duzen, dikkat ceken banner ve CTA bloklari.',
      heroCtaLabel: 'Simdi Incele',
      heroCtaHref: '#urunler',
      heroSecondaryCtaLabel: 'Sepete Git',
      heroSecondaryCtaHref: '/sepet',
      featureCards: [
        { title: 'Odak', text: 'Tek mesaj, guclu hareket' },
        { title: 'Hiz', text: 'Kisa yollarla satin alma' },
      ],
      productsEyebrow: 'Now',
      productsTitle: 'Vitrindeki urunler',
      productsSubtitle: 'Kontrastli yuzeylerle urunleri one cikar.',
      sections: [
        { id: 'hero', type: 'hero', enabled: true },
        {
          id: 'cta-ink',
          type: 'cta',
          enabled: true,
          title: 'Hazir misin?',
          body: 'Koleksiyonu ac ve ilk urununu sec.',
          ctaLabel: 'Urunlere Git',
          ctaHref: '#urunler',
        },
        { id: 'products', type: 'products', enabled: true },
        {
          id: 'banner-ink',
          type: 'banner',
          enabled: true,
          title: 'Ozel gunler icin stoklar guncel',
          body: 'Varyantli urunlerde anlik stok takibi.',
          ctaLabel: 'Detaylari Gor',
          ctaHref: '#urunler',
          tone: 'dark',
        },
      ],
    },
  },
];

function getThemePreset(themeId) {
  return THEME_PRESETS.find((theme) => theme.id === themeId) ?? null;
}

function listThemePresets() {
  return THEME_PRESETS.map(({ id, name, description, previewAccent }) => ({
    id,
    name,
    description,
    previewAccent,
  }));
}

function createSection(type) {
  switch (type) {
    case 'hero':
      return { id: uid('hero'), type: 'hero', enabled: true };
    case 'features':
      return { id: uid('features'), type: 'features', enabled: true };
    case 'products':
      return { id: uid('products'), type: 'products', enabled: true };
    case 'rich_text':
      return {
        id: uid('rich'),
        type: 'rich_text',
        enabled: true,
        title: 'Yeni metin bolumu',
        body: 'Buraya magaza hikayeni veya kampanya metnini yaz.',
        align: 'left',
      };
    case 'banner':
      return {
        id: uid('banner'),
        type: 'banner',
        enabled: true,
        title: 'Kampanya banner',
        body: 'Kisa duyuru veya firsat metni.',
        ctaLabel: 'Incele',
        ctaHref: '#urunler',
        tone: 'accent',
      };
    case 'cta':
      return {
        id: uid('cta'),
        type: 'cta',
        enabled: true,
        title: 'Harekete gec',
        body: 'Ziyaretciyi bir sonraki adima yonlendir.',
        ctaLabel: 'Alisverise Basla',
        ctaHref: '#urunler',
      };
    default:
      throw new Error(`Bilinmeyen section tipi: ${type}`);
  }
}

module.exports = {
  DEFAULT_FEATURES,
  DEFAULT_SECTIONS,
  THEME_PRESETS,
  getThemePreset,
  listThemePresets,
  createSection,
};

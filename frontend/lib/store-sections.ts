import type { StoreSection } from './types';

export function createStoreSection(type: StoreSection['type']): StoreSection {
  const id = `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  switch (type) {
    case 'hero':
      return { id, type: 'hero', enabled: true };
    case 'features':
      return { id, type: 'features', enabled: true };
    case 'products':
      return { id, type: 'products', enabled: true };
    case 'rich_text':
      return {
        id,
        type: 'rich_text',
        enabled: true,
        title: 'Yeni metin bolumu',
        body: 'Buraya tikla ve yazmaya basla. Bu blog gibi serbest bir alan.',
        align: 'center',
      };
    case 'banner':
      return {
        id,
        type: 'banner',
        enabled: true,
        title: 'Kampanya bandi',
        body: 'Firsatini yaz, butonu ayarla.',
        ctaLabel: 'Incele',
        ctaHref: '#urunler',
        tone: 'accent',
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        enabled: true,
        title: 'Simdi basla',
        body: 'Ziyaretciyi harekete geciren net bir cagri.',
        ctaLabel: 'Alisverise Basla',
        ctaHref: '#urunler',
      };
  }
}

export const SECTION_PALETTE: {
  type: StoreSection['type'];
  label: string;
  hint: string;
}[] = [
  { type: 'hero', label: 'Hero', hint: 'Baslik + butonlar (ust alan)' },
  { type: 'features', label: 'Ozellikler', hint: 'Ozellik kartlari (ekle/cikar, max 6)' },
  { type: 'products', label: 'Urunler', hint: 'Katalog listesi' },
  { type: 'rich_text', label: 'Metin', hint: 'Serbest yazi' },
  { type: 'banner', label: 'Banner', hint: 'Duyuru seridi' },
  { type: 'cta', label: 'CTA', hint: 'Buyuk buton alani' },
];

export function sectionLabel(type: StoreSection['type']) {
  return SECTION_PALETTE.find((item) => item.type === type)?.label ?? type;
}

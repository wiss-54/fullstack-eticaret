import type { StoreSection, StoreSettings } from './types';

export type StoreEditorMode = {
  selectedStyleKey: string | null;
  onSelectStyleKey: (key: string) => void;
  onTextChange: (key: string, value: string) => void;
  isMultiline: (key: string) => boolean;
  onAddProduct?: () => void;
};

export type EditorSelection =
  | { type: 'none' }
  | { type: 'header' }
  | { type: 'footer' }
  | { type: 'style' }
  | { type: 'product' }
  | { type: 'section'; sectionId: string }
  | {
      type: 'text';
      styleKey: string;
      label: string;
      sectionId?: string;
    };

export function selectionId(selection: EditorSelection | null): string | null {
  if (!selection || selection.type === 'none') return null;
  if (selection.type === 'text') return `text:${selection.styleKey}`;
  if (selection.type === 'section') return selection.sectionId;
  return `__${selection.type}__`;
}

export function parseLegacySelectionId(id: string | null): EditorSelection | null {
  if (!id) return { type: 'none' };
  if (id === '__header__') return { type: 'header' };
  if (id === '__footer__') return { type: 'footer' };
  if (id === '__style__') return { type: 'style' };
  if (id === '__product__') return { type: 'product' };
  if (id.startsWith('text:')) {
    return {
      type: 'text',
      styleKey: id.slice(5),
      label: id.slice(5),
    };
  }
  return { type: 'section', sectionId: id };
}

export function textTarget(
  styleKey: string,
  label: string,
  sectionId?: string,
): EditorSelection {
  return { type: 'text', styleKey, label, sectionId };
}

export function getTextValue(settings: StoreSettings, styleKey: string): string {
  if (styleKey === 'hero.eyebrow') return settings.heroEyebrow;
  if (styleKey === 'hero.title') return settings.heroTitle;
  if (styleKey === 'hero.subtitle') return settings.heroSubtitle;
  if (styleKey === 'products.eyebrow') return settings.productsEyebrow;
  if (styleKey === 'products.title') return settings.productsTitle;
  if (styleKey === 'products.subtitle') return settings.productsSubtitle;
  if (styleKey === 'footer.left') return settings.footerLeft;
  if (styleKey === 'footer.right') return settings.footerRight;

  const featureMatch = /^feature\.(\d+)\.(title|text)$/.exec(styleKey);
  if (featureMatch) {
    const index = Number(featureMatch[1]);
    const field = featureMatch[2] as 'title' | 'text';
    return settings.featureCards[index]?.[field] ?? '';
  }

  const sectionMatch = /^section\.([^.]+)\.(title|body)$/.exec(styleKey);
  if (sectionMatch) {
    const section = settings.sections.find((item) => item.id === sectionMatch[1]);
    if (!section || section.type === 'hero' || section.type === 'features' || section.type === 'products') {
      return '';
    }
    return section[sectionMatch[2] as 'title' | 'body'] ?? '';
  }

  return '';
}

export function setTextValue(
  settings: StoreSettings,
  styleKey: string,
  value: string,
): StoreSettings {
  if (styleKey === 'hero.eyebrow') return { ...settings, heroEyebrow: value };
  if (styleKey === 'hero.title') return { ...settings, heroTitle: value };
  if (styleKey === 'hero.subtitle') return { ...settings, heroSubtitle: value };
  if (styleKey === 'products.eyebrow') return { ...settings, productsEyebrow: value };
  if (styleKey === 'products.title') return { ...settings, productsTitle: value };
  if (styleKey === 'products.subtitle') return { ...settings, productsSubtitle: value };
  if (styleKey === 'footer.left') return { ...settings, footerLeft: value };
  if (styleKey === 'footer.right') return { ...settings, footerRight: value };

  const featureMatch = /^feature\.(\d+)\.(title|text)$/.exec(styleKey);
  if (featureMatch) {
    const index = Number(featureMatch[1]);
    const field = featureMatch[2] as 'title' | 'text';
    const featureCards = settings.featureCards.map((card, i) =>
      i === index ? { ...card, [field]: value } : card,
    );
    return { ...settings, featureCards };
  }

  const sectionMatch = /^section\.([^.]+)\.(title|body)$/.exec(styleKey);
  if (sectionMatch) {
    const field = sectionMatch[2] as 'title' | 'body';
    return {
      ...settings,
      sections: settings.sections.map((section) =>
        section.id === sectionMatch[1] && section.type !== 'hero' && section.type !== 'features' && section.type !== 'products'
          ? ({ ...section, [field]: value } as StoreSection)
          : section,
      ),
    };
  }

  return settings;
}

export function isMultilineTextKey(styleKey: string): boolean {
  return (
    styleKey.endsWith('.subtitle') ||
    styleKey.endsWith('.body') ||
    styleKey.endsWith('.text') ||
    styleKey.startsWith('footer.')
  );
}

const TEXT_LABELS: Record<string, string> = {
  'hero.eyebrow': 'Kucuk baslik',
  'hero.title': 'Ana baslik',
  'hero.subtitle': 'Aciklama',
  'products.eyebrow': 'Ust baslik',
  'products.title': 'Baslik',
  'products.subtitle': 'Aciklama',
  'footer.left': 'Alt bilgi sol',
  'footer.right': 'Alt bilgi sag',
};

export function getTextLabel(styleKey: string): string {
  if (TEXT_LABELS[styleKey]) return TEXT_LABELS[styleKey];

  const featureMatch = /^feature\.(\d+)\.(title|text)$/.exec(styleKey);
  if (featureMatch) {
    const index = Number(featureMatch[1]) + 1;
    return featureMatch[2] === 'title' ? `Kart ${index} baslik` : `Kart ${index} metin`;
  }

  const sectionMatch = /^section\.([^.]+)\.(title|body)$/.exec(styleKey);
  if (sectionMatch) {
    return sectionMatch[2] === 'title' ? 'Bolum basligi' : 'Bolum metni';
  }

  return 'Metin';
}

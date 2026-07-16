import type { CSSProperties } from 'react';
import type { StoreSettings, StoreTextStyle, StoreTextStyles } from './types';

export const TEXT_SIZE_OPTIONS: { value: NonNullable<StoreTextStyle['size']>; label: string }[] = [
  { value: 'xs', label: 'Cok kucuk' },
  { value: 'sm', label: 'Kucuk' },
  { value: 'base', label: 'Normal' },
  { value: 'lg', label: 'Buyuk' },
  { value: 'xl', label: 'XL' },
  { value: '2xl', label: '2XL' },
  { value: '3xl', label: '3XL' },
  { value: '4xl', label: '4XL' },
  { value: '5xl', label: '5XL' },
];

export const TEXT_WEIGHT_OPTIONS: { value: NonNullable<StoreTextStyle['weight']>; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Orta' },
  { value: 'semibold', label: 'Yarı kalın' },
  { value: 'bold', label: 'Kalın' },
];

export const TEXT_ALIGN_OPTIONS: { value: NonNullable<StoreTextStyle['align']>; label: string }[] = [
  { value: 'left', label: 'Sol' },
  { value: 'center', label: 'Orta' },
  { value: 'right', label: 'Sag' },
];

export const TEXT_COLOR_OPTIONS: { value: NonNullable<StoreTextStyle['color']>; label: string }[] = [
  { value: 'default', label: 'Varsayilan' },
  { value: 'accent', label: 'Marka rengi' },
  { value: 'muted', label: 'Soluk' },
  { value: 'light', label: 'Acik / beyaz' },
  { value: 'custom', label: 'Ozel renk' },
];

export const TEXT_LINE_HEIGHT_OPTIONS: {
  value: NonNullable<StoreTextStyle['lineHeight']>;
  label: string;
}[] = [
  { value: 'tight', label: 'Sikı' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Rahat' },
  { value: 'loose', label: 'Genis' },
];

export const TEXT_LETTER_SPACING_OPTIONS: {
  value: NonNullable<StoreTextStyle['letterSpacing']>;
  label: string;
}[] = [
  { value: 'tight', label: 'Dar' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Genis' },
];

const SIZE_CLASS: Record<NonNullable<StoreTextStyle['size']>, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
};

const WEIGHT_CLASS: Record<NonNullable<StoreTextStyle['weight']>, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const ALIGN_CLASS: Record<NonNullable<StoreTextStyle['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const LINE_HEIGHT_CLASS: Record<NonNullable<StoreTextStyle['lineHeight']>, string> = {
  tight: 'leading-tight',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

const LETTER_SPACING_CLASS: Record<NonNullable<StoreTextStyle['letterSpacing']>, string> = {
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
};

export function getTextStyle(
  textStyles: StoreTextStyles | undefined,
  key: string,
): StoreTextStyle | undefined {
  return textStyles?.[key];
}

export function patchTextStyle(
  settings: StoreSettings,
  key: string,
  patch: Partial<StoreTextStyle>,
): StoreSettings {
  const current = settings.textStyles?.[key] ?? {};
  const nextStyle = { ...current, ...patch };

  Object.keys(nextStyle).forEach((field) => {
    const value = nextStyle[field as keyof StoreTextStyle];
    if (value === undefined || value === 'default') {
      delete nextStyle[field as keyof StoreTextStyle];
    }
  });

  if (nextStyle.color !== 'custom') {
    delete nextStyle.customColor;
  }

  const textStyles = { ...(settings.textStyles ?? {}) };
  if (Object.keys(nextStyle).length === 0) {
    delete textStyles[key];
  } else {
    textStyles[key] = nextStyle;
  }

  return { ...settings, textStyles };
}

export function getTextStyleClasses(
  textStyles: StoreTextStyles | undefined,
  key: string,
): string {
  const style = getTextStyle(textStyles, key);
  if (!style) return '';

  const parts = [
    style.size ? SIZE_CLASS[style.size] : '',
    style.weight ? WEIGHT_CLASS[style.weight] : '',
    style.align ? ALIGN_CLASS[style.align] : '',
    style.lineHeight ? LINE_HEIGHT_CLASS[style.lineHeight] : '',
    style.letterSpacing ? LETTER_SPACING_CLASS[style.letterSpacing] : '',
    style.uppercase ? 'uppercase' : '',
    style.italic ? 'italic' : '',
    style.color === 'muted' ? 'text-zinc-600 dark:text-zinc-400' : '',
    style.color === 'light' ? 'text-white' : '',
  ];

  return parts.filter(Boolean).join(' ');
}

export function getTextStyleInline(
  textStyles: StoreTextStyles | undefined,
  key: string,
  accentColor: string,
): CSSProperties | undefined {
  const style = getTextStyle(textStyles, key);
  if (!style) return undefined;

  const inline: CSSProperties = {};
  if (style.color === 'accent') inline.color = accentColor;
  if (style.color === 'custom' && style.customColor) inline.color = style.customColor;
  if (style.uppercase && style.letterSpacing !== 'wide' && style.letterSpacing !== 'tight') {
    inline.letterSpacing = '0.14em';
  }

  return Object.keys(inline).length > 0 ? inline : undefined;
}

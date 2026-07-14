import type { StoreSettings } from './types';

export const FONT_STYLE_LABELS: Record<StoreSettings['fontStyle'], string> = {
  classic: 'Klasik (sade)',
  modern: 'Modern (sik)',
  elegant: 'Zarif (serif)',
};

export function getStoreShellClass(settings: StoreSettings) {
  const surface = {
    warm: 'bg-zinc-50 dark:bg-black',
    cool: 'bg-slate-50 dark:bg-slate-950',
    soft: 'bg-rose-50/40 dark:bg-zinc-950',
    contrast: 'bg-zinc-100 dark:bg-black',
  }[settings.surfaceStyle];

  const font = {
    classic: 'font-store-classic tracking-normal',
    modern: 'font-store-modern tracking-tight',
    elegant: 'font-store-elegant tracking-wide',
  }[settings.fontStyle];

  return `${surface} ${font}`;
}

export function getButtonRadiusClass(settings: StoreSettings) {
  return {
    pill: 'rounded-full',
    rounded: 'rounded-xl',
    square: 'rounded-none',
  }[settings.buttonStyle];
}

export function getCardRadiusClass(settings: StoreSettings) {
  return {
    soft: 'rounded-3xl',
    rounded: 'rounded-2xl',
    sharp: 'rounded-md',
  }[settings.radiusStyle];
}

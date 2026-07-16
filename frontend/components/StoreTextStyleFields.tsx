'use client';

import type { StoreSettings, StoreTextStyle } from '@/lib/types';
import {
  TEXT_ALIGN_OPTIONS,
  TEXT_COLOR_OPTIONS,
  TEXT_LETTER_SPACING_OPTIONS,
  TEXT_LINE_HEIGHT_OPTIONS,
  TEXT_SIZE_OPTIONS,
  TEXT_WEIGHT_OPTIONS,
  getTextStyle,
  patchTextStyle,
} from '@/lib/store-text-styles';

type Props = {
  settings: StoreSettings;
  styleKey: string;
  onChange: (next: StoreSettings) => void;
};

const selectClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-amber-700/30 focus:ring-2 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50';

export default function StoreTextStyleFields({ settings, styleKey, onChange }: Props) {
  const style = getTextStyle(settings.textStyles, styleKey) ?? {};

  function patch(field: keyof StoreTextStyle, value: StoreTextStyle[keyof StoreTextStyle]) {
    onChange(patchTextStyle(settings, styleKey, { [field]: value }));
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3 dark:border-stone-800 dark:bg-stone-900/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Yazi ozellikleri</p>

      <label className="block text-sm">
        <span className="mb-1 block text-stone-500">Boyut</span>
        <select
          className={selectClass}
          value={style.size ?? ''}
          onChange={(e) =>
            patch('size', (e.target.value || undefined) as StoreTextStyle['size'])
          }
        >
          <option value="">Varsayilan</option>
          {TEXT_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <span className="mb-1 block text-stone-500">Kalinlik</span>
          <select
            className={selectClass}
            value={style.weight ?? ''}
            onChange={(e) =>
              patch('weight', (e.target.value || undefined) as StoreTextStyle['weight'])
            }
          >
            <option value="">Varsayilan</option>
            {TEXT_WEIGHT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-stone-500">Hizalama</span>
          <select
            className={selectClass}
            value={style.align ?? ''}
            onChange={(e) =>
              patch('align', (e.target.value || undefined) as StoreTextStyle['align'])
            }
          >
            <option value="">Varsayilan</option>
            {TEXT_ALIGN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <span className="mb-1 block text-stone-500">Satir araligi</span>
          <select
            className={selectClass}
            value={style.lineHeight ?? ''}
            onChange={(e) =>
              patch('lineHeight', (e.target.value || undefined) as StoreTextStyle['lineHeight'])
            }
          >
            <option value="">Varsayilan</option>
            {TEXT_LINE_HEIGHT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-stone-500">Harf araligi</span>
          <select
            className={selectClass}
            value={style.letterSpacing ?? ''}
            onChange={(e) =>
              patch(
                'letterSpacing',
                (e.target.value || undefined) as StoreTextStyle['letterSpacing'],
              )
            }
          >
            <option value="">Varsayilan</option>
            {TEXT_LETTER_SPACING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-stone-500">Renk</span>
        <select
          className={selectClass}
          value={style.color ?? ''}
          onChange={(e) =>
            patch('color', (e.target.value || undefined) as StoreTextStyle['color'])
          }
        >
          <option value="">Varsayilan</option>
          {TEXT_COLOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {style.color === 'custom' ? (
        <label className="block text-sm">
          <span className="mb-1 block text-stone-500">Ozel renk</span>
          <div className="flex gap-2">
            <input
              type="color"
              className="h-10 w-12 rounded-lg border border-stone-300 dark:border-stone-700"
              value={style.customColor ?? '#111827'}
              onChange={(e) => patch('customColor', e.target.value)}
            />
            <input
              className={selectClass}
              value={style.customColor ?? '#111827'}
              onChange={(e) => patch('customColor', e.target.value)}
              placeholder="#111827"
            />
          </div>
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(style.uppercase)}
            onChange={(e) => patch('uppercase', e.target.checked || undefined)}
          />
          <span>Buyuk harf</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(style.italic)}
            onChange={(e) => patch('italic', e.target.checked || undefined)}
          />
          <span>Italik</span>
        </label>
      </div>
    </div>
  );
}

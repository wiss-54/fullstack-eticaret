'use client';

import type { Category, Product, StoreFeatureCard, StoreSection, StoreSettings } from '@/lib/types';
import type { EditorSelection } from '@/lib/editor-selection';
import {
  getTextValue,
  isMultilineTextKey,
  setTextValue,
} from '@/lib/editor-selection';
import ProductImageField from '@/components/ProductImageField';
import StoreEditorQuickProduct from '@/components/StoreEditorQuickProduct';
import StoreTextStyleFields from '@/components/StoreTextStyleFields';
import { sectionLabel } from '@/lib/store-sections';
import { FONT_STYLE_LABELS } from '@/lib/store-theme';

type Props = {
  settings: StoreSettings;
  selection: EditorSelection | null;
  serverLogoUrl: string | null;
  products: Product[];
  categories: Category[];
  onChange: (next: StoreSettings) => void;
  onServerLogoUrl: (value: string | null) => void;
  onProductCreated: (product: Product) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-stone-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-amber-700/30 focus:ring-2 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50';

function AppearanceFields({
  settings,
  patch,
}: {
  settings: StoreSettings;
  patch: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Yazi tipi">
        <select
          className={inputClass}
          value={settings.fontStyle}
          onChange={(e) => patch('fontStyle', e.target.value as StoreSettings['fontStyle'])}
        >
          {(Object.keys(FONT_STYLE_LABELS) as StoreSettings['fontStyle'][]).map((option) => (
            <option key={option} value={option}>
              {FONT_STYLE_LABELS[option]}
            </option>
          ))}
        </select>
      </Field>
      {(
        [
          ['surfaceStyle', 'Zemin', [
            ['warm', 'Sicak'],
            ['cool', 'Soguk'],
            ['soft', 'Yumusak'],
            ['contrast', 'Kontrast'],
          ]],
          ['radiusStyle', 'Kose', [
            ['soft', 'Cok yuvarlak'],
            ['rounded', 'Yuvarlak'],
            ['sharp', 'Keskin'],
          ]],
          ['buttonStyle', 'Buton', [
            ['pill', 'Kapsul'],
            ['rounded', 'Yuvarlak'],
            ['square', 'Kose'],
          ]],
        ] as const
      ).map(([key, label, options]) => (
        <Field key={key} label={label}>
          <select
            className={inputClass}
            value={settings[key]}
            onChange={(e) => patch(key, e.target.value as never)}
          >
            {options.map(([value, optionLabel]) => (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            ))}
          </select>
        </Field>
      ))}
    </div>
  );
}

function TextEditorPanel({
  settings,
  selection,
  onChange,
}: {
  settings: StoreSettings;
  selection: Extract<EditorSelection, { type: 'text' }>;
  onChange: (next: StoreSettings) => void;
}) {
  const value = getTextValue(settings, selection.styleKey);
  const multiline = isMultilineTextKey(selection.styleKey);

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Secili metin
        </p>
        <h3 className="mt-1 text-base font-semibold text-stone-900 dark:text-stone-50">
          {selection.label}
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          Metni ve yazi ozelliklerini buradan degistir.
        </p>
      </div>

      <Field label="Icerik">
        {multiline ? (
          <textarea
            className={`${inputClass} min-h-24`}
            value={value}
            onChange={(e) => onChange(setTextValue(settings, selection.styleKey, e.target.value))}
          />
        ) : (
          <input
            className={inputClass}
            value={value}
            onChange={(e) => onChange(setTextValue(settings, selection.styleKey, e.target.value))}
          />
        )}
      </Field>

      <StoreTextStyleFields
        settings={settings}
        styleKey={selection.styleKey}
        onChange={onChange}
      />
    </div>
  );
}

export default function StoreEditorInspector({
  settings,
  selection,
  serverLogoUrl,
  products,
  categories,
  onChange,
  onServerLogoUrl,
  onProductCreated,
}: Props) {
  function patch<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    onChange({ ...settings, [key]: value });
  }

  function patchSection(id: string, patchValue: Partial<StoreSection>) {
    onChange({
      ...settings,
      sections: settings.sections.map((section) =>
        section.id === id ? ({ ...section, ...patchValue } as StoreSection) : section,
      ),
    });
  }

  function patchFeature(index: number, key: keyof StoreFeatureCard, value: string) {
    const featureCards = settings.featureCards.map((card, i) =>
      i === index ? { ...card, [key]: value } : card,
    );
    patch('featureCards', featureCards);
  }

  if (!selection || selection.type === 'none') {
    return (
      <div className="space-y-4 overflow-y-auto p-4 text-sm text-stone-600 dark:text-stone-400">
        <div>
          <p className="text-base font-semibold text-stone-900 dark:text-stone-50">
            Metne veya bolme sec
          </p>
          <p className="mt-1 leading-relaxed">
            Onizlemede bir metne tikla → icerik + yazi ozellikleri acilir. Bolum arasindaki
            &quot;+ Bolum ekle&quot; ile yeni alan ekleyebilirsin.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-900/50">
          <StoreEditorQuickProduct categories={categories} onCreated={onProductCreated} />
        </div>
      </div>
    );
  }

  if (selection.type === 'text') {
    return (
      <TextEditorPanel settings={settings} selection={selection} onChange={onChange} />
    );
  }

  if (selection.type === 'header' || selection.type === 'style') {
    return (
      <div className="space-y-5 overflow-y-auto p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Marka & stil
          </p>
          <h3 className="mt-1 text-base font-semibold text-stone-900 dark:text-stone-50">
            Genel gorunum
          </h3>
        </div>

        <Field label="Marka adi">
          <input
            className={inputClass}
            value={settings.brandName}
            onChange={(e) => patch('brandName', e.target.value)}
          />
        </Field>
        <Field label="Vurgu rengi">
          <div className="flex gap-2">
            <input
              type="color"
              className="h-10 w-12 rounded-lg border border-stone-300 dark:border-stone-700"
              value={settings.accentColor}
              onChange={(e) => patch('accentColor', e.target.value)}
            />
            <input
              className={inputClass}
              value={settings.accentColor}
              onChange={(e) => patch('accentColor', e.target.value)}
            />
          </div>
        </Field>
        <ProductImageField
          value={settings.logoUrl ?? ''}
          serverImageUrl={serverLogoUrl}
          onChange={(logoUrl) => {
            patch('logoUrl', logoUrl || null);
            if (!logoUrl) onServerLogoUrl(null);
          }}
        />

        <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
          <p className="mb-3 text-sm font-medium text-stone-900 dark:text-stone-50">Tipografi & stil</p>
          <AppearanceFields settings={settings} patch={patch} />
        </div>
      </div>
    );
  }

  if (selection.type === 'footer') {
    return (
      <div className="space-y-4 overflow-y-auto p-4">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">Alt bilgi</h3>
        <p className="text-xs text-stone-500">
          Alt bilgi metinlerine tiklayarak da duzenleyebilirsin.
        </p>
        <Field label="Sol metin">
          <textarea
            className={`${inputClass} min-h-20`}
            value={settings.footerLeft}
            onChange={(e) => patch('footerLeft', e.target.value)}
          />
        </Field>
        <StoreTextStyleFields settings={settings} styleKey="footer.left" onChange={onChange} />
        <Field label="Sag metin">
          <textarea
            className={`${inputClass} min-h-20`}
            value={settings.footerRight}
            onChange={(e) => patch('footerRight', e.target.value)}
          />
        </Field>
        <StoreTextStyleFields settings={settings} styleKey="footer.right" onChange={onChange} />
      </div>
    );
  }

  if (selection.type === 'product') {
    return (
      <div className="space-y-4 overflow-y-auto p-4">
        <StoreEditorQuickProduct categories={categories} onCreated={onProductCreated} />
        <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Vitrindeki urunler ({products.length})
          </p>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {products.slice(0, 12).map((product) => (
              <li
                key={product.id}
                className="truncate rounded-lg bg-stone-50 px-2 py-1.5 text-stone-700 dark:bg-stone-900 dark:text-stone-300"
              >
                {product.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const section = settings.sections.find((item) => item.id === selection.sectionId);
  if (!section) {
    return <div className="p-4 text-sm text-stone-500">Bolum bulunamadi.</div>;
  }

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          {sectionLabel(section.type)}
        </p>
        <h3 className="mt-1 text-base font-semibold text-stone-900 dark:text-stone-50">
          Bolum ayarlari
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          Metinlere tiklayarak tek tek duzenleyebilirsin.
        </p>
      </div>

      {section.type === 'hero' ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              Hero kutucuklari
            </p>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">
              Sirala ve duzenle
            </h3>
            <p className="text-xs text-stone-500">
              Aşağıdaki listeleri sürükle-bırak yaparak kutucukların sırasını değiştir.
            </p>
          </div>

          <Field label="Hero duzeni">
            <select
              className={inputClass}
              value={settings.heroLayout}
              onChange={(e) => patch('heroLayout', e.target.value as StoreSettings['heroLayout'])}
            >
              <option value="split">Yan yana</option>
              <option value="centered">Ortali</option>
              <option value="minimal">Minimal</option>
            </select>
          </Field>

          {(() => {
            const heroTextOrder =
              settings.heroTextItemsOrder && settings.heroTextItemsOrder.length > 0
                ? settings.heroTextItemsOrder
                : ['eyebrow', 'title', 'subtitle', 'ctas'];
            const heroCtaOrder =
              settings.heroCtaButtonsOrder && settings.heroCtaButtonsOrder.length > 0
                ? settings.heroCtaButtonsOrder
                : ['primary', 'secondary'];
            const heroFeatureSide =
              settings.heroFeatureSide === 'left' || settings.heroFeatureSide === 'right'
                ? settings.heroFeatureSide
                : 'right';

            const textItems = [
              { key: 'eyebrow', label: 'Kucuk baslik' },
              { key: 'title', label: 'Ana baslik' },
              { key: 'subtitle', label: 'Aciklama' },
              { key: 'ctas', label: 'CTA kutusu' },
            ] as const;

            const ctaButtons = [
              { key: 'primary', label: 'Ana buton' },
              { key: 'secondary', label: '2. buton' },
            ] as const;

            function moveOrder<T>(arr: T[], fromIndex: number, toIndex: number) {
              const next = [...arr];
              const [moved] = next.splice(fromIndex, 1);
              next.splice(toIndex, 0, moved);
              return next;
            }

            const split = settings.heroLayout === 'split';

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900/30">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Kutucuk sirasi
                  </p>
                  <div className="space-y-2">
                    {heroTextOrder.map((itemKey, index) => {
                      const label = textItems.find((t) => t.key === itemKey)?.label ?? itemKey;
                      return (
                        <div
                          key={itemKey}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('heroTextFromIndex', String(index));
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = Number(e.dataTransfer.getData('heroTextFromIndex'));
                            if (Number.isNaN(from) || from === index) return;
                            const next = moveOrder(heroTextOrder, from, index);
                            patch('heroTextItemsOrder', next as StoreSettings['heroTextItemsOrder']);
                          }}
                          className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-950/40"
                        >
                          <div className="text-sm font-medium text-stone-700 dark:text-stone-200">
                            {label}
                          </div>
                          <div className="text-xs text-stone-400" aria-hidden>
                            ≡
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900/30">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    CTA buton sirasi
                  </p>
                  <div className="space-y-2">
                    {heroCtaOrder.map((btnKey, index) => {
                      const label = ctaButtons.find((b) => b.key === btnKey)?.label ?? btnKey;
                      return (
                        <div
                          key={btnKey}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('heroCtaFromIndex', String(index));
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = Number(e.dataTransfer.getData('heroCtaFromIndex'));
                            if (Number.isNaN(from) || from === index) return;
                            const next = moveOrder(heroCtaOrder, from, index);
                            patch('heroCtaButtonsOrder', next as StoreSettings['heroCtaButtonsOrder']);
                          }}
                          className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-950/40"
                        >
                          <div className="text-sm font-medium text-stone-700 dark:text-stone-200">
                            {label}
                          </div>
                          <div className="text-xs text-stone-400" aria-hidden>
                            ≡
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900/30">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Feature kartlarinin yeri
                  </p>
                  <p className="mb-2 text-xs text-stone-500">
                    Bu ayar sadece <b>Yan yana</b> (split) modunda geçerli.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!split}
                      onClick={() => patch('heroFeatureSide', 'left' as StoreSettings['heroFeatureSide'])}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        heroFeatureSide === 'left'
                          ? 'border-amber-700 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-100'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-amber-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-200'
                      } ${!split ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Sol
                    </button>
                    <button
                      type="button"
                      disabled={!split}
                      onClick={() => patch('heroFeatureSide', 'right' as StoreSettings['heroFeatureSide'])}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        heroFeatureSide === 'right'
                          ? 'border-amber-700 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-100'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-amber-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-200'
                      } ${!split ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Sag
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-100">
                    Metin ve buton içerikleri
                  </p>
                  <div className="space-y-3">
                    <Field label="Kucuk baslik">
                      <input
                        className={inputClass}
                        value={settings.heroEyebrow}
                        onChange={(e) => patch('heroEyebrow', e.target.value)}
                      />
                    </Field>
                    <Field label="Ana baslik">
                      <input
                        className={inputClass}
                        value={settings.heroTitle}
                        onChange={(e) => patch('heroTitle', e.target.value)}
                      />
                    </Field>
                    <Field label="Aciklama">
                      <textarea
                        className={`${inputClass} min-h-24`}
                        value={settings.heroSubtitle}
                        onChange={(e) => patch('heroSubtitle', e.target.value)}
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Ana buton metni">
                        <input
                          className={inputClass}
                          value={settings.heroCtaLabel}
                          onChange={(e) => patch('heroCtaLabel', e.target.value)}
                        />
                      </Field>
                      <Field label="Ana buton linki">
                        <input
                          className={inputClass}
                          value={settings.heroCtaHref}
                          onChange={(e) => patch('heroCtaHref', e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="2. buton metni">
                        <input
                          className={inputClass}
                          value={settings.heroSecondaryCtaLabel}
                          onChange={(e) => patch('heroSecondaryCtaLabel', e.target.value)}
                        />
                      </Field>
                      <Field label="2. buton linki">
                        <input
                          className={inputClass}
                          value={settings.heroSecondaryCtaHref}
                          onChange={(e) => patch('heroSecondaryCtaHref', e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}

      {section.type === 'features' ? (
        <div className="space-y-3">
          <p className="text-xs text-stone-500">Kart metinlerine tikla veya buradan duzenle.</p>
          {settings.featureCards.slice(0, 4).map((card, index) => (
            <div
              key={index}
              className="space-y-2 rounded-xl border border-stone-200 p-3 dark:border-stone-800"
            >
              <input
                className={inputClass}
                placeholder="Baslik"
                value={card.title}
                onChange={(e) => patchFeature(index, 'title', e.target.value)}
              />
              <textarea
                className={`${inputClass} min-h-16`}
                placeholder="Metin"
                value={card.text}
                onChange={(e) => patchFeature(index, 'text', e.target.value)}
              />
            </div>
          ))}
        </div>
      ) : null}

      {section.type === 'products' ? (
        <div className="space-y-4">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            Urun basliklarina tikla veya asagidan hizli urun ekle.
          </p>

          <div className="rounded-xl border border-dashed border-amber-700/40 bg-amber-50/60 p-3 dark:border-amber-600/40 dark:bg-amber-950/20">
            <StoreEditorQuickProduct categories={categories} onCreated={onProductCreated} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Su an vitrinde ({products.length})
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
              {products.slice(0, 8).map((product) => (
                <li
                  key={product.id}
                  className="truncate rounded-lg bg-stone-50 px-2 py-1.5 text-stone-700 dark:bg-stone-900 dark:text-stone-300"
                >
                  {product.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {section.type === 'rich_text' ? (
        <div className="space-y-3">
          <Field label="Hizalama">
            <select
              className={inputClass}
              value={section.align ?? 'left'}
              onChange={(e) =>
                patchSection(section.id, { align: e.target.value as 'left' | 'center' })
              }
            >
              <option value="left">Sol</option>
              <option value="center">Orta</option>
            </select>
          </Field>
          <p className="text-xs text-stone-500">Baslik ve metne onizlemede tikla.</p>
        </div>
      ) : null}

      {section.type === 'banner' || section.type === 'cta' ? (
        <div className="space-y-3">
          <Field label="Buton yazisi">
            <input
              className={inputClass}
              value={section.ctaLabel ?? ''}
              onChange={(e) => patchSection(section.id, { ctaLabel: e.target.value })}
            />
          </Field>
          <Field label="Buton linki">
            <input
              className={inputClass}
              value={section.ctaHref ?? ''}
              onChange={(e) => patchSection(section.id, { ctaHref: e.target.value })}
            />
          </Field>
          {section.type === 'banner' ? (
            <Field label="Renk stili">
              <select
                className={inputClass}
                value={section.tone ?? 'accent'}
                onChange={(e) =>
                  patchSection(section.id, {
                    tone: e.target.value as 'accent' | 'muted' | 'dark',
                  })
                }
              >
                <option value="accent">Marka rengi</option>
                <option value="muted">Acik</option>
                <option value="dark">Koyu</option>
              </select>
            </Field>
          ) : null}
          <p className="text-xs text-stone-500">Baslik ve metne onizlemede tikla.</p>
        </div>
      ) : null}
    </div>
  );
}

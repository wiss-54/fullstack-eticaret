'use client';

import type { Category, Product, StoreFeatureCard, StoreSection, StoreSettings } from '@/lib/types';
import ProductImageField from '@/components/ProductImageField';
import StoreEditorQuickProduct from '@/components/StoreEditorQuickProduct';
import { sectionLabel } from '@/lib/store-sections';
import { FONT_STYLE_LABELS } from '@/lib/store-theme';

type Props = {
  settings: StoreSettings;
  selectedId: string | null;
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

export default function StoreEditorInspector({
  settings,
  selectedId,
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

  if (!selectedId) {
    return (
      <div className="space-y-4 overflow-y-auto p-4 text-sm text-stone-600 dark:text-stone-400">
        <div>
          <p className="text-base font-semibold text-stone-900 dark:text-stone-50">
            Bolum sec veya urun ekle
          </p>
          <p className="mt-1 leading-relaxed">
            Ortadaki onizlemede bir alana tikla. Urun eklemek icin soldan &quot;Urun ekle&quot;ye bas
            veya Urunler bolumunu sec.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-900/50">
          <StoreEditorQuickProduct categories={categories} onCreated={onProductCreated} />
        </div>
      </div>
    );
  }

  if (selectedId === '__header__' || selectedId === '__style__') {
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

  if (selectedId === '__footer__') {
    return (
      <div className="space-y-4 overflow-y-auto p-4">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">Alt bilgi</h3>
        <Field label="Sol metin">
          <textarea
            className={`${inputClass} min-h-20`}
            value={settings.footerLeft}
            onChange={(e) => patch('footerLeft', e.target.value)}
          />
        </Field>
        <Field label="Sag metin">
          <textarea
            className={`${inputClass} min-h-20`}
            value={settings.footerRight}
            onChange={(e) => patch('footerRight', e.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (selectedId === '__product__') {
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

  const section = settings.sections.find((item) => item.id === selectedId);
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
      </div>

      {section.type === 'hero' ? (
        <div className="space-y-3">
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
          {(
            [
              ['heroEyebrow', 'Kucuk baslik'],
              ['heroTitle', 'Ana baslik'],
              ['heroSubtitle', 'Aciklama'],
              ['heroCtaLabel', 'Ana buton'],
              ['heroCtaHref', 'Ana buton link'],
              ['heroSecondaryCtaLabel', '2. buton'],
              ['heroSecondaryCtaHref', '2. buton link'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              {key === 'heroSubtitle' ? (
                <textarea
                  className={`${inputClass} min-h-24`}
                  value={settings[key]}
                  onChange={(e) => patch(key, e.target.value)}
                />
              ) : (
                <input
                  className={inputClass}
                  value={settings[key]}
                  onChange={(e) => patch(key, e.target.value)}
                />
              )}
            </Field>
          ))}
        </div>
      ) : null}

      {section.type === 'features' ? (
        <div className="space-y-3">
          <p className="text-xs text-stone-500">Kartlari burada duzenle (max 4).</p>
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
          <Field label="Ust baslik">
            <input
              className={inputClass}
              value={settings.productsEyebrow}
              onChange={(e) => patch('productsEyebrow', e.target.value)}
            />
          </Field>
          <Field label="Baslik">
            <input
              className={inputClass}
              value={settings.productsTitle}
              onChange={(e) => patch('productsTitle', e.target.value)}
            />
          </Field>
          <Field label="Aciklama">
            <textarea
              className={`${inputClass} min-h-20`}
              value={settings.productsSubtitle}
              onChange={(e) => patch('productsSubtitle', e.target.value)}
            />
          </Field>

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
          <Field label="Baslik">
            <input
              className={inputClass}
              value={section.title}
              onChange={(e) => patchSection(section.id, { title: e.target.value })}
            />
          </Field>
          <Field label="Metin">
            <textarea
              className={`${inputClass} min-h-28`}
              value={section.body}
              onChange={(e) => patchSection(section.id, { body: e.target.value })}
            />
          </Field>
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
        </div>
      ) : null}

      {section.type === 'banner' || section.type === 'cta' ? (
        <div className="space-y-3">
          <Field label="Baslik">
            <input
              className={inputClass}
              value={section.title}
              onChange={(e) => patchSection(section.id, { title: e.target.value })}
            />
          </Field>
          <Field label="Metin">
            <textarea
              className={`${inputClass} min-h-20`}
              value={section.body}
              onChange={(e) => patchSection(section.id, { body: e.target.value })}
            />
          </Field>
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
        </div>
      ) : null}
    </div>
  );
}

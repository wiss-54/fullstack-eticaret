'use client';

import type { StoreFeatureCard, StoreSection, StoreSettings } from '@/lib/types';
import ProductImageField from '@/components/ProductImageField';
import { sectionLabel } from '@/lib/store-sections';

type Props = {
  settings: StoreSettings;
  selectedId: string | null;
  serverLogoUrl: string | null;
  onChange: (next: StoreSettings) => void;
  onServerLogoUrl: (value: string | null) => void;
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
      <span className="mb-1 block text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900';

export default function StoreEditorInspector({
  settings,
  selectedId,
  serverLogoUrl,
  onChange,
  onServerLogoUrl,
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
      <div className="space-y-3 p-4 text-sm text-zinc-600 dark:text-zinc-400">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">Ne yapmak istiyorsun?</p>
        <p>Ortadaki sayfada bir bolume tikla. Ya da soldan yeni bolum ekle.</p>
        <p>Degisiklikler aninda onizlemede gorunur. Bitince ustteki Kaydet&apos;e bas.</p>
      </div>
    );
  }

  if (selectedId === '__header__') {
    return (
      <div className="space-y-4 overflow-y-auto p-4">
        <h3 className="font-semibold">Ust bar / Marka</h3>
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
              className="h-10 w-12 rounded border"
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
      </div>
    );
  }

  if (selectedId === '__footer__') {
    return (
      <div className="space-y-4 overflow-y-auto p-4">
        <h3 className="font-semibold">Footer</h3>
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

  const section = settings.sections.find((item) => item.id === selectedId);
  if (!section) {
    return <div className="p-4 text-sm text-zinc-500">Bolum bulunamadi.</div>;
  }

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">{sectionLabel(section.type)}</p>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Bolum ayarlari</h3>
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
          <p className="text-xs text-zinc-500">Kartlari burada duzenle (max 4).</p>
          {settings.featureCards.slice(0, 4).map((card, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
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
        <div className="space-y-3">
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

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h4 className="text-sm font-medium">Genel gorunum</h4>
        {(
          [
            ['surfaceStyle', 'Zemin', ['warm', 'cool', 'soft', 'contrast']],
            ['radiusStyle', 'Kose', ['soft', 'rounded', 'sharp']],
            ['buttonStyle', 'Buton', ['pill', 'rounded', 'square']],
            ['fontStyle', 'Yazi', ['classic', 'modern', 'elegant']],
          ] as const
        ).map(([key, label, options]) => (
          <Field key={key} label={label}>
            <select
              className={inputClass}
              value={settings[key]}
              onChange={(e) => patch(key, e.target.value as never)}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        ))}
      </div>
    </div>
  );
}

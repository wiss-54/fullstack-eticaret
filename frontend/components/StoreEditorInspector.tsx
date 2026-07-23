'use client';

import { useState } from 'react';
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
  onRemoveSection?: (id: string) => void;
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
      <span className="mb-1 block text-admin-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text outline-none ring-admin-primary/30 focus:ring-2';

function InspectorShell({
  title,
  subtitle,
  hint,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  hint?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-admin-surface">
      <div className="shrink-0 border-b border-admin-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {subtitle ? (
              <p className="font-admin-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-admin-muted">
                {subtitle}
              </p>
            ) : null}
            <h3 className="mt-0.5 truncate text-base font-semibold text-admin-text">{title}</h3>
            {hint ? <p className="mt-1 text-xs leading-relaxed text-admin-muted">{hint}</p> : null}
          </div>
          {actions}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
    </div>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-admin-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-admin-surface-low px-3 py-2.5 text-left text-sm font-semibold text-admin-text"
      >
        <span>{title}</span>
        <span className="text-admin-muted">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="space-y-3 border-t border-admin-border p-3">{children}</div> : null}
    </div>
  );
}

function ReorderList<T extends string>({
  items,
  labels,
  onMove,
}: {
  items: T[];
  labels: Record<T, string>;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((itemKey, index) => (
        <div
          key={itemKey}
          className="flex items-center gap-2 rounded-lg border border-admin-border bg-admin-bg px-2 py-2"
        >
          <span className="flex-1 text-sm font-medium text-admin-text">
            {labels[itemKey] ?? itemKey}
          </span>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMove(index, index - 1)}
              className="rounded-md border border-admin-border px-2 py-1 text-xs text-admin-text disabled:opacity-30"
              title="Yukari"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={index === items.length - 1}
              onClick={() => onMove(index, index + 1)}
              className="rounded-md border border-admin-border px-2 py-1 text-xs text-admin-text disabled:opacity-30"
              title="Asagi"
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

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

function HeroPanel({
  settings,
  patch,
}: {
  settings: StoreSettings;
  patch: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
}) {
  const [openContent, setOpenContent] = useState(true);
  const [openLayout, setOpenLayout] = useState(true);
  const [openOrder, setOpenOrder] = useState(false);

  const heroTextOrder =
    settings.heroTextItemsOrder && settings.heroTextItemsOrder.length > 0
      ? settings.heroTextItemsOrder
      : (['eyebrow', 'title', 'subtitle', 'ctas'] as const);

  const heroCtaOrder =
    settings.heroCtaButtonsOrder && settings.heroCtaButtonsOrder.length > 0
      ? settings.heroCtaButtonsOrder
      : (['primary', 'secondary'] as const);

  function moveOrder<T>(arr: readonly T[], fromIndex: number, toIndex: number): T[] {
    const next = [...arr];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  }

  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-admin-primary/30 bg-admin-primary-container/15 px-3 py-2 text-xs leading-relaxed text-admin-text">
        Ozellik kartlari artik Hero icinde degil. Onlari ayri <b>Ozellikler</b> bolumuyle ekle —
        cakisma olmaz.
      </p>

      <Accordion title="1. Icerik (yazi & buton)" open={openContent} onToggle={() => setOpenContent((v) => !v)}>
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
        <p className="text-[11px] text-admin-muted">
          Butonlar sadece canli sitede gider. Editorde tiklanmaz.
        </p>
      </Accordion>

      <Accordion title="2. Duzen" open={openLayout} onToggle={() => setOpenLayout((v) => !v)}>
        <Field label="Hero duzeni">
          <select
            className={inputClass}
            value={settings.heroLayout}
            onChange={(e) => patch('heroLayout', e.target.value as StoreSettings['heroLayout'])}
          >
            <option value="centered">Ortali (onerilen)</option>
            <option value="split">Sol hizali genis</option>
            <option value="minimal">Minimal</option>
          </select>
        </Field>
      </Accordion>

      <Accordion title="3. Sira (metin / buton)" open={openOrder} onToggle={() => setOpenOrder((v) => !v)}>
        <p className="text-xs text-admin-muted">↑ ↓ ile sirayi degistir.</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Metin sirasi</p>
        <ReorderList
          items={[...heroTextOrder]}
          labels={{
            eyebrow: 'Kucuk baslik',
            title: 'Ana baslik',
            subtitle: 'Aciklama',
            ctas: 'Butonlar',
          }}
          onMove={(from, to) =>
            patch(
              'heroTextItemsOrder',
              moveOrder(heroTextOrder, from, to) as StoreSettings['heroTextItemsOrder'],
            )
          }
        />
        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">
          Buton sirasi
        </p>
        <ReorderList
          items={[...heroCtaOrder]}
          labels={{
            primary: 'Ana buton',
            secondary: '2. buton',
          }}
          onMove={(from, to) =>
            patch(
              'heroCtaButtonsOrder',
              moveOrder(heroCtaOrder, from, to) as StoreSettings['heroCtaButtonsOrder'],
            )
          }
        />
      </Accordion>
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
  onRemoveSection,
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

  const canRemoveSection = settings.sections.length > 1;

  if (!selection || selection.type === 'none') {
    return (
      <InspectorShell
        title="Bir sey sec"
        hint="Ortadaki onizlemede bir bolume veya metne tikla. Soldan bolum ekleyebilirsin."
      >
        <div className="rounded-xl border border-dashed border-admin-border bg-admin-surface-low p-3">
          <StoreEditorQuickProduct categories={categories} onCreated={onProductCreated} />
        </div>
      </InspectorShell>
    );
  }

  if (selection.type === 'text') {
    const value = getTextValue(settings, selection.styleKey);
    const multiline = isMultilineTextKey(selection.styleKey);
    return (
      <InspectorShell
        title={selection.label}
        subtitle="Secili metin"
        hint="Icerigi ve yazi ozelliklerini buradan degistir. Cift tikla → sayfada da yazabilirsin."
      >
        <div className="space-y-4">
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
      </InspectorShell>
    );
  }

  if (selection.type === 'header' || selection.type === 'style') {
    return (
      <InspectorShell
        title="Genel gorunum"
        subtitle="Marka & stil"
        hint="Marka adi, logo ve yazi tipini buradan degistir. Canvas'ta Header'a da tiklayabilirsin."
      >
        <div className="space-y-4">
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
                className="h-10 w-12 rounded-lg border border-admin-border"
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
          <div className="border-t border-admin-border pt-4 ">
            <p className="mb-3 text-sm font-medium text-admin-text">
              Tipografi & stil
            </p>
            <AppearanceFields settings={settings} patch={patch} />
          </div>
        </div>
      </InspectorShell>
    );
  }

  if (selection.type === 'footer') {
    return (
      <InspectorShell title="Alt bilgi" hint="Sol ve sag metinleri buradan duzenle.">
        <div className="space-y-4">
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
      </InspectorShell>
    );
  }

  if (selection.type === 'product') {
    return (
      <InspectorShell title="Urun ekle" subtitle="Hizli islem">
        <div className="space-y-4">
          <StoreEditorQuickProduct categories={categories} onCreated={onProductCreated} />
          <div className="border-t border-admin-border pt-4 ">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">
              Vitrindeki urunler ({products.length})
            </p>
            <ul className="space-y-1 text-sm">
              {products.slice(0, 12).map((product) => (
                <li
                  key={product.id}
                  className="truncate rounded-lg bg-admin-surface-low px-2 py-1.5 text-admin-text bg-admin-surface-high "
                >
                  {product.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </InspectorShell>
    );
  }

  const section = settings.sections.find((item) => item.id === selection.sectionId);
  if (!section) {
    return (
      <InspectorShell title="Bolum bulunamadi">
        <p className="text-sm text-admin-muted">Baska bir bolum sec.</p>
      </InspectorShell>
    );
  }

  const removeAction =
    canRemoveSection && onRemoveSection ? (
      <button
        type="button"
        onClick={() => onRemoveSection(section.id)}
        className="shrink-0 rounded-lg border border-admin-danger/50 px-2.5 py-1.5 text-xs font-semibold text-admin-danger hover:bg-admin-danger/10"
      >
        Sil
      </button>
    ) : null;

  return (
    <InspectorShell
      title={sectionLabel(section.type)}
      subtitle="Bolum ayarlari"
      hint="Icerik, duzen ve sirayi asagidan ayarla. Kaydet ile yayinla."
      actions={removeAction}
    >
      {section.type === 'hero' ? <HeroPanel settings={settings} patch={patch} /> : null}

      {section.type === 'features' ? (
        <div className="space-y-3">
          <p className="text-xs text-admin-muted">Kart metinlerini buradan duzenle (max 4).</p>
          {settings.featureCards.slice(0, 4).map((card, index) => (
            <div
              key={index}
              className="space-y-2 rounded-xl border border-admin-border p-3"
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
          <div className="rounded-xl border border-dashed border-admin-primary/40 bg-admin-primary-container/10 p-3">
            <StoreEditorQuickProduct categories={categories} onCreated={onProductCreated} />
          </div>
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
    </InspectorShell>
  );
}

import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import StoreEditableText from '@/components/StoreEditableText';
import type { StoreEditorMode } from '@/lib/editor-selection';
import type { Category, Product, StoreSection, StoreSettings } from '@/lib/types';
import { getTextStyleClasses, getTextStyleInline } from '@/lib/store-text-styles';
import { getButtonRadiusClass, getCardRadiusClass } from '@/lib/store-theme';

type Props = {
  section: StoreSection;
  settings: StoreSettings;
  products: Product[];
  categories: Category[];
  activeCategoryId?: number;
  error: string | null;
  editor?: StoreEditorMode;
};

function SectionText({
  styleKey,
  value,
  settings,
  editor,
  className,
  as = 'p',
}: {
  styleKey: string;
  value: string;
  settings: StoreSettings;
  editor?: StoreEditorMode;
  className?: string;
  as?: 'p' | 'h2' | 'h3' | 'span';
}) {
  const accent = settings.accentColor;

  if (editor) {
    return (
      <StoreEditableText
        styleKey={styleKey}
        value={value}
        textStyles={settings.textStyles}
        accentColor={accent}
        selected={editor.selectedStyleKey === styleKey}
        multiline={editor.isMultiline(styleKey)}
        onSelect={editor.onSelectStyleKey}
        onChange={(next) => editor.onTextChange(styleKey, next)}
        className={className}
        as={as}
      />
    );
  }

  const styleClasses = getTextStyleClasses(settings.textStyles, styleKey);
  const inlineStyle = getTextStyleInline(settings.textStyles, styleKey, accent);
  const Tag = as;
  return (
    <Tag className={`${styleClasses} ${className}`} style={inlineStyle}>
      {value}
    </Tag>
  );
}

export default function StoreSectionBlock({
  section,
  settings,
  products,
  categories,
  activeCategoryId,
  error,
  editor,
}: Props) {
  if (!section.enabled) return null;

  const accent = settings.accentColor;
  const btn = getButtonRadiusClass(settings);
  const card = getCardRadiusClass(settings);

  if (section.type === 'features') {
    const features = settings.featureCards ?? [];
    if (features.length === 0) return null;
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item, index) => (
            <div
              key={`${item.title}-${item.text}`}
              className={`${card} border border-store-border bg-store-surface p-5`}
            >
              <SectionText
                styleKey={`feature.${index}.title`}
                value={item.title}
                settings={settings}
                editor={editor}
                className="font-semibold text-store-text"
                as="p"
              />
              <SectionText
                styleKey={`feature.${index}.text`}
                value={item.text}
                settings={settings}
                editor={editor}
                className="mt-2 text-sm text-store-muted"
                as="p"
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === 'products') {
    return (
      <section id="urunler" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-10">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionText
              styleKey="products.eyebrow"
              value={settings.productsEyebrow}
              settings={settings}
              editor={editor}
              className="text-sm font-semibold uppercase tracking-[0.18em] text-store-accent-text"
              as="p"
            />
            <SectionText
              styleKey="products.title"
              value={settings.productsTitle}
              settings={settings}
              editor={editor}
              className="text-3xl font-bold text-store-text"
              as="h2"
            />
          </div>
          <SectionText
            styleKey="products.subtitle"
            value={settings.productsSubtitle}
            settings={settings}
            editor={editor}
            className="max-w-md text-sm text-store-muted"
            as="p"
          />
        </div>

        {editor ? (
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                editor.onAddProduct?.();
              }}
              className="rounded-xl border border-dashed border-amber-700 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-100"
            >
              + Urun ekle
            </button>
          </div>
        ) : null}

        <CategoryFilter
          categories={categories}
          activeCategoryId={activeCategoryId}
          interactive={!editor}
        />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className={`${card} border border-dashed border-store-border bg-store-surface p-12 text-center`}>
            <p className="text-lg font-medium text-store-text">Henuz urun yok</p>
            {editor ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  editor.onAddProduct?.();
                }}
                className="mt-4 rounded-xl bg-amber-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Ilk urunu ekle
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} interactive={!editor} />
            ))}
          </div>
        )}
      </section>
    );
  }

  if (section.type === 'rich_text') {
    const titleKey = `section.${section.id}.title`;
    const bodyKey = `section.${section.id}.body`;
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div
              className={`${card} border border-store-border bg-store-surface p-8 ${
            section.align === 'center' ? 'text-center' : ''
          }`}
        >
          <SectionText
            styleKey={titleKey}
            value={section.title}
            settings={settings}
            editor={editor}
            className="text-2xl font-bold text-store-text"
            as="h2"
          />
          <SectionText
            styleKey={bodyKey}
            value={section.body}
            settings={settings}
            editor={editor}
            className="mt-3 whitespace-pre-wrap leading-relaxed text-store-muted"
            as="p"
          />
        </div>
      </section>
    );
  }

  if (section.type === 'banner') {
    const titleKey = `section.${section.id}.title`;
    const bodyKey = `section.${section.id}.body`;
    const tone = section.tone ?? 'accent';
    const style =
      tone === 'dark'
        ? { backgroundColor: '#111827', color: '#fff' }
        : tone === 'muted'
          ? { backgroundColor: '#f4f4f5', color: '#18181b' }
          : { backgroundColor: `${accent}18`, color: accent };

    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className={`${card} flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`} style={style}>
          <div>
            <SectionText
              styleKey={titleKey}
              value={section.title}
              settings={settings}
              editor={editor}
              className="text-xl font-semibold"
              as="h3"
            />
            <SectionText
              styleKey={bodyKey}
              value={section.body}
              settings={settings}
              editor={editor}
              className="mt-1 text-sm opacity-90"
              as="p"
            />
          </div>
          {section.ctaLabel && section.ctaHref ? (
            editor ? (
              <span
                className={`${btn} cursor-default px-5 py-2 text-sm font-semibold`}
                style={
                  tone === 'dark'
                    ? { backgroundColor: '#fff', color: '#111827' }
                    : { backgroundColor: accent, color: '#fff' }
                }
                title="Canli sitede calisir"
              >
                {section.ctaLabel}
              </span>
            ) : (
              <Link
                href={section.ctaHref}
                className={`${btn} px-5 py-2 text-sm font-semibold`}
                style={
                  tone === 'dark'
                    ? { backgroundColor: '#fff', color: '#111827' }
                    : { backgroundColor: accent, color: '#fff' }
                }
              >
                {section.ctaLabel}
              </Link>
            )
          ) : null}
        </div>
      </section>
    );
  }

  if (section.type === 'cta') {
    const titleKey = `section.${section.id}.title`;
    const bodyKey = `section.${section.id}.body`;
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div
          className={`${card} border border-store-border bg-store-surface p-10 text-center`}
        >
          <SectionText
            styleKey={titleKey}
            value={section.title}
            settings={settings}
            editor={editor}
            className="text-3xl font-bold text-store-text"
            as="h2"
          />
          <SectionText
            styleKey={bodyKey}
            value={section.body}
            settings={settings}
            editor={editor}
            className="mx-auto mt-3 max-w-2xl text-store-muted"
            as="p"
          />
          {editor ? (
            <span
              className={`${btn} mt-6 inline-block cursor-default px-6 py-3 text-sm font-semibold text-white`}
              style={{ backgroundColor: accent }}
              title="Canli sitede calisir"
            >
              {section.ctaLabel}
            </span>
          ) : (
            <Link
              href={section.ctaHref}
              className={`${btn} mt-6 inline-block px-6 py-3 text-sm font-semibold text-white`}
              style={{ backgroundColor: accent }}
            >
              {section.ctaLabel}
            </Link>
          )}
        </div>
      </section>
    );
  }

  return null;
}

import type { StoreEditorMode } from '@/lib/editor-selection';
import type { StoreSettings } from '@/lib/types';
import StoreEditableText from '@/components/StoreEditableText';
import { getTextStyleClasses, getTextStyleInline } from '@/lib/store-text-styles';
import { getButtonRadiusClass } from '@/lib/store-theme';

type StoreHeroProps = {
  settings: StoreSettings;
  editor?: StoreEditorMode;
};

function HeroText({
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
  const accent = settings.accentColor || '#855300';

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

function HeroCta({
  label,
  href,
  variant,
  accent,
  btnClass,
  preview,
}: {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
  accent: string;
  btnClass: string;
  preview?: boolean;
}) {
  const className =
    variant === 'primary'
      ? `${btnClass} px-8 py-4 text-sm font-semibold text-store-on-primary shadow-sm transition hover:opacity-90`
      : `${btnClass} bg-store-inverse px-8 py-4 text-sm font-semibold text-store-inverse-text shadow-sm transition hover:opacity-90`;
  const style = variant === 'primary' ? { backgroundColor: accent } : undefined;

  if (preview) {
    return (
      <span
        className={`${className} cursor-default select-none`}
        style={style}
        title="Canli sitede calisir"
        onClick={(e) => e.preventDefault()}
      >
        {label}
      </span>
    );
  }

  return (
    <a href={href} className={className} style={style}>
      {label}
    </a>
  );
}

export default function StoreHero({ settings, editor }: StoreHeroProps) {
  const accent = settings.accentColor || '#855300';
  const btn = getButtonRadiusClass(settings);
  const preview = Boolean(editor);

  const heroTextItemsOrder =
    settings.heroTextItemsOrder && settings.heroTextItemsOrder.length > 0
      ? settings.heroTextItemsOrder
      : ['eyebrow', 'title', 'subtitle', 'ctas'];

  const heroCtaButtonsOrder =
    settings.heroCtaButtonsOrder && settings.heroCtaButtonsOrder.length > 0
      ? settings.heroCtaButtonsOrder
      : ['primary', 'secondary'];

  const isCentered = settings.heroLayout === 'centered' || settings.heroLayout === 'minimal';
  const isSplit = settings.heroLayout === 'split';

  const mtClassByKey: Record<string, string> = {
    eyebrow: '',
    title: 'mt-4',
    subtitle: 'mt-5',
    ctas: 'mt-10',
  };

  const surfaceClass =
    settings.surfaceStyle === 'cool'
      ? 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50'
      : settings.surfaceStyle === 'soft'
        ? 'border-store-border bg-gradient-to-br from-rose-50 via-store-bg to-amber-50/40'
        : settings.surfaceStyle === 'contrast'
          ? 'border-store-border bg-gradient-to-br from-store-surface-low via-store-surface to-store-bg'
          : 'border-store-border bg-gradient-to-br from-store-bg via-white to-[#fff8ef]';

  return (
    <section className={`relative overflow-hidden border-b ${surfaceClass}`}>
      <div
        className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ backgroundColor: `${accent}33` }}
      />
      <div
        className={`relative mx-auto max-w-7xl px-4 md:px-10 ${
          settings.heroLayout === 'minimal' ? 'py-12' : 'py-16 md:py-20'
        } ${isSplit ? 'lg:max-w-3xl lg:pl-10' : ''}`}
      >
        <div className={isCentered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
          {heroTextItemsOrder.map((key, index) => {
            const mt = index === 0 ? '' : mtClassByKey[key] ?? '';

            if (key === 'eyebrow') {
              return (
                <div key={key} className={mt}>
                  <HeroText
                    styleKey="hero.eyebrow"
                    value={settings.heroEyebrow}
                    settings={settings}
                    editor={editor}
                    className="inline-block rounded bg-store-surface-low px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-store-accent-text"
                    as="p"
                  />
                </div>
              );
            }

            if (key === 'title') {
              return (
                <div key={key} className={mt}>
                  <HeroText
                    styleKey="hero.title"
                    value={settings.heroTitle}
                    settings={settings}
                    editor={editor}
                    className={`font-bold tracking-tight text-store-text ${
                      settings.heroLayout === 'minimal'
                        ? 'text-3xl md:text-4xl'
                        : 'text-4xl md:text-5xl lg:text-6xl'
                    }`}
                    as="h2"
                  />
                </div>
              );
            }

            if (key === 'subtitle') {
              return (
                <div key={key} className={mt}>
                  <HeroText
                    styleKey="hero.subtitle"
                    value={settings.heroSubtitle}
                    settings={settings}
                    editor={editor}
                    className={`text-lg leading-relaxed text-store-muted ${
                      isCentered ? 'mx-auto max-w-2xl' : 'max-w-xl'
                    }`}
                    as="p"
                  />
                </div>
              );
            }

            return (
              <div key={key} className={mt}>
                <div className={`flex flex-wrap gap-3 ${isCentered ? 'justify-center' : ''}`}>
                  {heroCtaButtonsOrder.map((btnKey) =>
                    btnKey === 'primary' ? (
                      <HeroCta
                        key={btnKey}
                        label={settings.heroCtaLabel}
                        href={settings.heroCtaHref}
                        variant="primary"
                        accent={accent}
                        btnClass={btn}
                        preview={preview}
                      />
                    ) : (
                      <HeroCta
                        key={btnKey}
                        label={settings.heroSecondaryCtaLabel}
                        href={settings.heroSecondaryCtaHref}
                        variant="secondary"
                        accent={accent}
                        btnClass={btn}
                        preview={preview}
                      />
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

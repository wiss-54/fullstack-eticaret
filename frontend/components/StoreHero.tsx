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
  const accent = settings.accentColor || '#92400e';

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
      ? `${btnClass} px-6 py-3 text-sm font-semibold text-white shadow-sm`
      : `${btnClass} border bg-white/80 px-6 py-3 text-sm font-semibold backdrop-blur dark:bg-zinc-950/60`;
  const style =
    variant === 'primary'
      ? { backgroundColor: accent }
      : { borderColor: `${accent}66`, color: accent };

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
  const accent = settings.accentColor || '#92400e';
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
    title: 'mt-3',
    subtitle: 'mt-4',
    ctas: 'mt-8',
  };

  return (
    <section
      className={`relative overflow-hidden border-b ${
        settings.surfaceStyle === 'cool'
          ? 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900'
          : settings.surfaceStyle === 'soft'
            ? 'border-rose-100 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:border-rose-900/40 dark:from-zinc-950 dark:to-rose-950/20'
            : settings.surfaceStyle === 'contrast'
              ? 'border-zinc-300 bg-gradient-to-br from-zinc-200 via-white to-zinc-100 dark:border-zinc-700 dark:from-zinc-900 dark:to-black'
              : 'border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:border-amber-900/40 dark:from-zinc-950 dark:via-amber-950/20 dark:to-rose-950/20'
      }`}
    >
      <div className="absolute -right-16 top-0 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
      <div
        className={`relative mx-auto max-w-6xl px-6 ${
          settings.heroLayout === 'minimal' ? 'py-10' : 'py-14'
        } ${isSplit ? 'lg:max-w-3xl lg:pl-6' : ''}`}
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
                    className="text-sm font-semibold uppercase tracking-[0.2em]"
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
                    className={`font-bold tracking-tight text-zinc-900 dark:text-zinc-50 ${
                      settings.heroLayout === 'minimal'
                        ? 'text-3xl lg:text-4xl'
                        : 'text-4xl lg:text-5xl'
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
                    className={`text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 ${
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

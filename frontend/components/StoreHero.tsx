import Link from 'next/link';
import type { StoreSettings } from '@/lib/types';
import { getButtonRadiusClass, getCardRadiusClass } from '@/lib/store-theme';

type StoreHeroProps = {
  settings: StoreSettings;
};

export default function StoreHero({ settings }: StoreHeroProps) {
  const accent = settings.accentColor || '#92400e';
  const btn = getButtonRadiusClass(settings);
  const card = getCardRadiusClass(settings);
  const features =
    settings.featureCards?.length > 0
      ? settings.featureCards
      : [
          { title: 'Kisisellestirme', text: 'Her urune ozel secenekler ve not alani' },
          { title: 'Guvenli Siparis', text: 'Stok ve secenek kontrolu otomatik' },
        ];

  const isCentered = settings.heroLayout === 'centered' || settings.heroLayout === 'minimal';
  const showFeatureRail = settings.heroLayout === 'split';

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
        className={`relative mx-auto grid max-w-6xl gap-8 px-6 ${
          settings.heroLayout === 'minimal' ? 'py-10' : 'py-14'
        } ${showFeatureRail ? 'lg:grid-cols-[1.2fr_0.8fr] lg:items-center' : ''}`}
      >
        <div className={isCentered ? 'mx-auto max-w-3xl text-center' : ''}>
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            {settings.heroEyebrow}
          </p>
          <h2
            className={`mt-3 font-bold tracking-tight text-zinc-900 dark:text-zinc-50 ${
              settings.heroLayout === 'minimal' ? 'text-3xl lg:text-4xl' : 'text-4xl lg:text-5xl'
            }`}
          >
            {settings.heroTitle}
          </h2>
          <p
            className={`mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 ${
              isCentered ? 'mx-auto max-w-2xl' : 'max-w-xl'
            }`}
          >
            {settings.heroSubtitle}
          </p>
          <div
            className={`mt-8 flex flex-wrap gap-3 ${isCentered ? 'justify-center' : ''}`}
          >
            <a
              href={settings.heroCtaHref}
              className={`${btn} px-6 py-3 text-sm font-semibold text-white shadow-sm`}
              style={{ backgroundColor: accent }}
            >
              {settings.heroCtaLabel}
            </a>
            <Link
              href={settings.heroSecondaryCtaHref}
              className={`${btn} border bg-white/80 px-6 py-3 text-sm font-semibold backdrop-blur dark:bg-zinc-950/60`}
              style={{ borderColor: `${accent}66`, color: accent }}
            >
              {settings.heroSecondaryCtaLabel}
            </Link>
          </div>
        </div>

        {showFeatureRail ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {features.slice(0, 4).map((item) => (
              <div
                key={`${item.title}-${item.text}`}
                className={`${card} border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70`}
              >
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

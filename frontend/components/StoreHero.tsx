import Link from 'next/link';
import type { StoreSettings } from '@/lib/types';

type StoreHeroProps = {
  settings: StoreSettings;
};

export default function StoreHero({ settings }: StoreHeroProps) {
  const accent = settings.accentColor || '#92400e';
  const features =
    settings.featureCards?.length > 0
      ? settings.featureCards
      : [
          { title: 'Kisisellestirme', text: 'Her urune ozel secenekler ve not alani' },
          { title: 'Guvenli Siparis', text: 'Stok ve secenek kontrolu otomatik' },
        ];

  return (
    <section className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:border-amber-900/40 dark:from-zinc-950 dark:via-amber-950/20 dark:to-rose-950/20">
      <div className="absolute -right-16 top-0 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
      <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            {settings.heroEyebrow}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-5xl">
            {settings.heroTitle}
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            {settings.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={settings.heroCtaHref}
              className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: accent }}
            >
              {settings.heroCtaLabel}
            </a>
            <Link
              href={settings.heroSecondaryCtaHref}
              className="rounded-full border bg-white/80 px-6 py-3 text-sm font-semibold backdrop-blur dark:bg-zinc-950/60"
              style={{ borderColor: `${accent}66`, color: accent }}
            >
              {settings.heroSecondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((card) => (
            <div
              key={`${card.title}-${card.text}`}
              className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70"
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">{card.title}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

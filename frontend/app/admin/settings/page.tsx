'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  StoreFeatureCard,
  StoreSection,
  StoreSettings,
  StoreThemePreset,
} from '@/lib/types';
import {
  adminApplyStoreTheme,
  adminGetStoreSettings,
  adminGetStoreThemes,
  adminUpdateStoreSettings,
  clearAdminToken,
  getAdminToken,
} from '@/lib/admin-api';
import ProductImageField from '@/components/ProductImageField';
import { getAdminPaths } from '@/lib/admin-paths';

const emptyFeatures: StoreFeatureCard[] = [
  { title: '', text: '' },
  { title: '', text: '' },
  { title: '', text: '' },
  { title: '', text: '' },
];

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function createSection(type: StoreSection['type']): StoreSection {
  switch (type) {
    case 'hero':
      return { id: newId('hero'), type: 'hero', enabled: true };
    case 'features':
      return { id: newId('features'), type: 'features', enabled: true };
    case 'products':
      return { id: newId('products'), type: 'products', enabled: true };
    case 'rich_text':
      return {
        id: newId('rich'),
        type: 'rich_text',
        enabled: true,
        title: 'Yeni metin bolumu',
        body: 'Buraya magaza hikayeni yaz.',
        align: 'left',
      };
    case 'banner':
      return {
        id: newId('banner'),
        type: 'banner',
        enabled: true,
        title: 'Kampanya banner',
        body: 'Kisa duyuru metni',
        ctaLabel: 'Incele',
        ctaHref: '#urunler',
        tone: 'accent',
      };
    case 'cta':
      return {
        id: newId('cta'),
        type: 'cta',
        enabled: true,
        title: 'Harekete gec',
        body: 'Ziyaretciyi yonlendiren blok',
        ctaLabel: 'Alisverise Basla',
        ctaHref: '#urunler',
      };
  }
}

export default function AdminStoreSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [themes, setThemes] = useState<StoreThemePreset[]>([]);
  const [serverLogoUrl, setServerLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingTheme, setApplyingTheme] = useState<string | null>(null);

  useEffect(() => {
    const paths = getAdminPaths();
    if (!getAdminToken()) {
      router.replace(paths.login);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [data, themeList] = await Promise.all([
          adminGetStoreSettings(),
          adminGetStoreThemes(),
        ]);
        if (!cancelled) {
          setForm({
            ...data,
            featureCards:
              data.featureCards?.length > 0
                ? [...data.featureCards, ...emptyFeatures].slice(0, 4)
                : emptyFeatures,
            sections: data.sections?.length
              ? data.sections
              : [
                  { id: 'hero', type: 'hero', enabled: true },
                  { id: 'features', type: 'features', enabled: true },
                  { id: 'products', type: 'products', enabled: true },
                ],
          });
          setServerLogoUrl(data.logoUrl);
          setThemes(themeList);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ayarlar yuklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateField<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
  }

  function updateFeature(index: number, key: keyof StoreFeatureCard, value: string) {
    setForm((current) => {
      if (!current) return current;
      const featureCards = current.featureCards.map((card, i) =>
        i === index ? { ...card, [key]: value } : card,
      );
      return { ...current, featureCards };
    });
    setSaved(false);
  }

  function moveSection(index: number, direction: -1 | 1) {
    setForm((current) => {
      if (!current) return current;
      const next = [...current.sections];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, sections: next };
    });
    setSaved(false);
  }

  function patchSection(id: string, patch: Partial<StoreSection>) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        sections: current.sections.map((section) =>
          section.id === id ? ({ ...section, ...patch } as StoreSection) : section,
        ),
      };
    });
    setSaved(false);
  }

  function removeSection(id: string) {
    setForm((current) => {
      if (!current) return current;
      const next = current.sections.filter((section) => section.id !== id);
      return { ...current, sections: next.length ? next : current.sections };
    });
    setSaved(false);
  }

  function addSection(type: StoreSection['type']) {
    setForm((current) => {
      if (!current) return current;
      return { ...current, sections: [...current.sections, createSection(type)] };
    });
    setSaved(false);
  }

  async function handleApplyTheme(themeId: StoreThemePreset['id']) {
    setApplyingTheme(themeId);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminApplyStoreTheme(themeId);
      setForm({
        ...updated,
        featureCards:
          updated.featureCards.length > 0
            ? [...updated.featureCards, ...emptyFeatures].slice(0, 4)
            : emptyFeatures,
      });
      setServerLogoUrl(updated.logoUrl);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tema uygulanamadi');
    } finally {
      setApplyingTheme(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const featureCards = form.featureCards.filter(
        (card) => card.title.trim() && card.text.trim(),
      );
      const updated = await adminUpdateStoreSettings({
        ...form,
        logoUrl: form.logoUrl?.trim() || null,
        featureCards,
      });
      setForm({
        ...updated,
        featureCards:
          updated.featureCards.length > 0
            ? [...updated.featureCards, ...emptyFeatures].slice(0, 4)
            : emptyFeatures,
      });
      setServerLogoUrl(updated.logoUrl);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydetme basarisiz');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="min-h-full bg-zinc-50 p-10 dark:bg-black">
        <p className="text-zinc-500">Yukleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-sm font-medium text-zinc-500">Admin Panel</p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Magaza Tasarimi</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Hazir temalar, bolum (div) ekleme ve tasarim ozellikleri
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={getAdminPaths().dashboard} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
              Urunler
            </Link>
            <Link href={getAdminPaths().site} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
              Siteye Git
            </Link>
            <button
              type="button"
              onClick={() => {
                clearAdminToken();
                router.push(getAdminPaths().login);
              }}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Cikis
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Hazir temalar</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Bir temaya tikla: renk, hero duzeni, bolumler ve yazi stili otomatik ayarlanir (logo/marka korunur).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                disabled={applyingTheme === theme.id}
                onClick={() => void handleApplyTheme(theme.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.themeId === theme.id
                    ? 'border-zinc-900 ring-2 ring-zinc-900/20 dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div
                  className="mb-3 h-16 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${theme.previewAccent}, ${theme.previewAccent}88)`,
                  }}
                />
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{theme.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{theme.description}</p>
                <p className="mt-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {applyingTheme === theme.id
                    ? 'Uygulaniyor...'
                    : form.themeId === theme.id
                      ? 'Aktif'
                      : 'Uygula'}
                </p>
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Tasarim ozellikleri</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ['surfaceStyle', 'Yuzey', ['warm', 'cool', 'soft', 'contrast']],
                  ['radiusStyle', 'Kose', ['soft', 'rounded', 'sharp']],
                  ['buttonStyle', 'Buton', ['pill', 'rounded', 'square']],
                  ['heroLayout', 'Hero duzeni', ['split', 'centered', 'minimal']],
                  ['fontStyle', 'Yazi stili', ['classic', 'modern', 'elegant']],
                ] as const
              ).map(([key, label, options]) => (
                <label key={key} className="block text-sm">
                  <span className="mb-1 block text-zinc-500">{label}</span>
                  <select
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value as never)}
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-500">Vurgu rengi</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-12 w-14 rounded-lg border border-zinc-300"
                    value={form.accentColor}
                    onChange={(e) => updateField('accentColor', e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                    value={form.accentColor}
                    onChange={(e) => updateField('accentColor', e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Ana sayfa bolumleri (divler)</h2>
                <p className="text-sm text-zinc-500">Sirala, ac/kapa, yeni blok ekle.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['rich_text', 'Metin'],
                    ['banner', 'Banner'],
                    ['cta', 'CTA'],
                    ['features', 'Ozellikler'],
                    ['products', 'Urunler'],
                    ['hero', 'Hero'],
                  ] as const
                ).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addSection(type)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                  >
                    + {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {form.sections.map((section, index) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium uppercase dark:bg-zinc-900">
                        {section.type}
                      </span>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={(e) => patchSection(section.id, { enabled: e.target.checked })}
                        />
                        Aktif
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="text-xs" onClick={() => moveSection(index, -1)}>
                        Yukari
                      </button>
                      <button type="button" className="text-xs" onClick={() => moveSection(index, 1)}>
                        Asagi
                      </button>
                      {section.type !== 'hero' && section.type !== 'products' ? (
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() => removeSection(section.id)}
                        >
                          Sil
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {section.type === 'rich_text' ? (
                    <div className="mt-3 grid gap-2">
                      <input
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        value={section.title}
                        onChange={(e) => patchSection(section.id, { title: e.target.value })}
                      />
                      <textarea
                        className="min-h-20 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        value={section.body}
                        onChange={(e) => patchSection(section.id, { body: e.target.value })}
                      />
                      <select
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        value={section.align ?? 'left'}
                        onChange={(e) =>
                          patchSection(section.id, {
                            align: e.target.value as 'left' | 'center',
                          })
                        }
                      >
                        <option value="left">Sola</option>
                        <option value="center">Ortala</option>
                      </select>
                    </div>
                  ) : null}

                  {section.type === 'banner' || section.type === 'cta' ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        value={section.title}
                        onChange={(e) => patchSection(section.id, { title: e.target.value })}
                        placeholder="Baslik"
                      />
                      <input
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        value={section.ctaLabel ?? ''}
                        onChange={(e) => patchSection(section.id, { ctaLabel: e.target.value })}
                        placeholder="Buton yazisi"
                      />
                      <textarea
                        className="min-h-16 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-2"
                        value={section.body}
                        onChange={(e) => patchSection(section.id, { body: e.target.value })}
                        placeholder="Metin"
                      />
                      <input
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-2"
                        value={section.ctaHref ?? ''}
                        onChange={(e) => patchSection(section.id, { ctaHref: e.target.value })}
                        placeholder="Buton linki"
                      />
                      {section.type === 'banner' ? (
                        <select
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                          value={section.tone ?? 'accent'}
                          onChange={(e) =>
                            patchSection(section.id, {
                              tone: e.target.value as 'accent' | 'muted' | 'dark',
                            })
                          }
                        >
                          <option value="accent">Accent</option>
                          <option value="muted">Muted</option>
                          <option value="dark">Dark</option>
                        </select>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Marka</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.brandName}
                onChange={(e) => updateField('brandName', e.target.value)}
                required
              />
            </div>
            <div className="mt-4">
              <ProductImageField
                value={form.logoUrl ?? ''}
                serverImageUrl={serverLogoUrl}
                onChange={(logoUrl) => {
                  updateField('logoUrl', logoUrl || null);
                  if (!logoUrl) setServerLogoUrl(null);
                }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Hero metinleri</h2>
            <div className="mt-4 grid gap-4">
              {(
                [
                  ['heroEyebrow', 'Ust baslik'],
                  ['heroTitle', 'Ana baslik'],
                  ['heroSubtitle', 'Aciklama'],
                  ['heroCtaLabel', 'Birincil buton'],
                  ['heroCtaHref', 'Birincil link'],
                  ['heroSecondaryCtaLabel', 'Ikincil buton'],
                  ['heroSecondaryCtaHref', 'Ikincil link'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm">
                  <span className="mb-1 block text-zinc-500">{label}</span>
                  {key === 'heroSubtitle' ? (
                    <textarea
                      className="min-h-20 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                      value={form[key]}
                      onChange={(e) => updateField(key, e.target.value)}
                      required
                    />
                  ) : (
                    <input
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                      value={form[key]}
                      onChange={(e) => updateField(key, e.target.value)}
                      required
                    />
                  )}
                </label>
              ))}
            </div>
            <h3 className="mt-6 font-medium">Ozellik kartlari</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {form.featureCards.slice(0, 4).map((card, index) => (
                <div key={index} className="space-y-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <input
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="Baslik"
                    value={card.title}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                  />
                  <textarea
                    className="min-h-16 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="Metin"
                    value={card.text}
                    onChange={(e) => updateFeature(index, 'text', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Urun listesi + Footer</h2>
            <div className="mt-4 grid gap-4">
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.productsEyebrow}
                onChange={(e) => updateField('productsEyebrow', e.target.value)}
                required
              />
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.productsTitle}
                onChange={(e) => updateField('productsTitle', e.target.value)}
                required
              />
              <textarea
                className="min-h-16 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.productsSubtitle}
                onChange={(e) => updateField('productsSubtitle', e.target.value)}
                required
              />
              <textarea
                className="min-h-16 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.footerLeft}
                onChange={(e) => updateField('footerLeft', e.target.value)}
                required
              />
              <textarea
                className="min-h-16 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.footerRight}
                onChange={(e) => updateField('footerRight', e.target.value)}
                required
              />
            </div>
          </section>

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Kaydedildi. Ana sayfayi yenile.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? 'Kaydediliyor...' : 'Tasarimi Kaydet'}
          </button>
        </form>
      </main>
    </div>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { StoreFeatureCard, StoreSettings } from '@/lib/types';
import {
  adminGetStoreSettings,
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

export default function AdminStoreSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [serverLogoUrl, setServerLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const paths = getAdminPaths();
    if (!getAdminToken()) {
      router.replace(paths.login);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const data = await adminGetStoreSettings();
        if (!cancelled) {
          setForm({
            ...data,
            featureCards:
              data.featureCards?.length > 0
                ? [...data.featureCards, ...emptyFeatures].slice(0, 4)
                : emptyFeatures,
          });
          setServerLogoUrl(data.logoUrl);
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

  function handleLogout() {
    clearAdminToken();
    router.push(getAdminPaths().login);
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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Magaza Ayarlari</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Ana sayfa, marka ve footer metinlerini kod yazmadan duzenle
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={getAdminPaths().dashboard}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Urunler
            </Link>
            <Link
              href={getAdminPaths().orders}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Siparisler
            </Link>
            <Link
              href={getAdminPaths().site}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Siteye Git
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Cikis
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Marka</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-500">Marka adi</span>
                <input
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.brandName}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-500">Vurgu rengi</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-12 w-14 rounded-lg border border-zinc-300 dark:border-zinc-700"
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
            <h2 className="text-lg font-semibold">Hero / Ana vitrin</h2>
            <div className="mt-4 grid gap-4">
              {(
                [
                  ['heroEyebrow', 'Ust kucuk baslik'],
                  ['heroTitle', 'Ana baslik'],
                  ['heroSubtitle', 'Aciklama'],
                  ['heroCtaLabel', 'Birincil buton yazisi'],
                  ['heroCtaHref', 'Birincil buton linki'],
                  ['heroSecondaryCtaLabel', 'Ikincil buton yazisi'],
                  ['heroSecondaryCtaHref', 'Ikincil buton linki'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm">
                  <span className="mb-1 block text-zinc-500">{label}</span>
                  {key === 'heroSubtitle' ? (
                    <textarea
                      className="min-h-24 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
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

            <h3 className="mt-6 font-medium">Ozellik kartlari (max 4)</h3>
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
                    placeholder="Kisa metin"
                    value={card.text}
                    onChange={(e) => updateFeature(index, 'text', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Urun listesi bolumu</h2>
            <div className="mt-4 grid gap-4">
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Bolum ust basligi"
                value={form.productsEyebrow}
                onChange={(e) => updateField('productsEyebrow', e.target.value)}
                required
              />
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Bolum basligi"
                value={form.productsTitle}
                onChange={(e) => updateField('productsTitle', e.target.value)}
                required
              />
              <textarea
                className="min-h-20 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Bolum aciklamasi"
                value={form.productsSubtitle}
                onChange={(e) => updateField('productsSubtitle', e.target.value)}
                required
              />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Footer</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <textarea
                className="min-h-20 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.footerLeft}
                onChange={(e) => updateField('footerLeft', e.target.value)}
                required
              />
              <textarea
                className="min-h-20 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
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
              Kaydedildi. Ana sayfayi yenileyerek sonucu gorebilirsin.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? 'Kaydediliyor...' : 'Ayarlari Kaydet'}
          </button>
        </form>
      </main>
    </div>
  );
}

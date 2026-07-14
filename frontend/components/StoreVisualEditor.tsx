'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Category, Product, StoreSettings, StoreThemePreset } from '@/lib/types';
import {
  adminApplyStoreTheme,
  adminGetCategories,
  adminGetProducts,
  adminGetStoreSettings,
  adminGetStoreThemes,
  adminUpdateStoreSettings,
  clearAdminToken,
  getAdminToken,
} from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';
import { createStoreSection, SECTION_PALETTE } from '@/lib/store-sections';
import StoreEditorCanvas from '@/components/StoreEditorCanvas';
import StoreEditorInspector from '@/components/StoreEditorInspector';

const emptyFeatures = [
  { title: '', text: '' },
  { title: '', text: '' },
  { title: '', text: '' },
  { title: '', text: '' },
];

export default function StoreVisualEditor() {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [themes, setThemes] = useState<StoreThemePreset[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverLogoUrl, setServerLogoUrl] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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
        const [store, themeList, productList, categoryList] = await Promise.all([
          adminGetStoreSettings(),
          adminGetStoreThemes(),
          adminGetProducts(),
          adminGetCategories(),
        ]);
        if (cancelled) return;
        setSettings({
          ...store,
          featureCards:
            store.featureCards?.length > 0
              ? [...store.featureCards, ...emptyFeatures].slice(0, 4)
              : emptyFeatures,
          sections: store.sections?.length
            ? store.sections
            : [
                { id: 'hero', type: 'hero', enabled: true },
                { id: 'features', type: 'features', enabled: true },
                { id: 'products', type: 'products', enabled: true },
              ],
        });
        setServerLogoUrl(store.logoUrl);
        setThemes(themeList);
        setProducts(productList);
        setCategories(categoryList);
        setSelectedId(store.sections?.[0]?.id ?? 'hero');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Editor yuklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateSettings(next: StoreSettings) {
    setSettings(next);
    setSaved(false);
  }

  function addSection(type: (typeof SECTION_PALETTE)[number]['type']) {
    if (!settings) return;
    const section = createStoreSection(type);
    updateSettings({ ...settings, sections: [...settings.sections, section] });
    setSelectedId(section.id);
  }

  function reorder(fromId: string, toId: string) {
    if (!settings) return;
    const list = [...settings.sections];
    const from = list.findIndex((item) => item.id === fromId);
    const to = list.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    updateSettings({ ...settings, sections: list });
  }

  function toggleSection(id: string) {
    if (!settings) return;
    updateSettings({
      ...settings,
      sections: settings.sections.map((section) =>
        section.id === id ? { ...section, enabled: !section.enabled } : section,
      ),
    });
  }

  function removeSection(id: string) {
    if (!settings) return;
    const next = settings.sections.filter((section) => section.id !== id);
    if (next.length === 0) return;
    updateSettings({ ...settings, sections: next });
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  }

  async function handleApplyTheme(themeId: StoreThemePreset['id']) {
    setApplyingTheme(themeId);
    setError(null);
    try {
      const updated = await adminApplyStoreTheme(themeId);
      setSettings({
        ...updated,
        featureCards:
          updated.featureCards.length > 0
            ? [...updated.featureCards, ...emptyFeatures].slice(0, 4)
            : emptyFeatures,
      });
      setServerLogoUrl(updated.logoUrl);
      setSaved(true);
      setSelectedId(updated.sections[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tema uygulanamadi');
    } finally {
      setApplyingTheme(null);
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const featureCards = settings.featureCards.filter(
        (card) => card.title.trim() && card.text.trim(),
      );
      const updated = await adminUpdateStoreSettings({
        ...settings,
        logoUrl: settings.logoUrl?.trim() || null,
        featureCards,
      });
      setSettings({
        ...updated,
        featureCards:
          updated.featureCards.length > 0
            ? [...updated.featureCards, ...emptyFeatures].slice(0, 4)
            : emptyFeatures,
      });
      setServerLogoUrl(updated.logoUrl);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-100 dark:bg-black">
        <p className="text-zinc-500">{error ?? 'Gorsel editor yukleniyor...'}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-100 dark:bg-black">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Gorsel tasarim</p>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Sayfayi fare ile yerlestir
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={getAdminPaths().dashboard}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
          >
            Urunler
          </Link>
          <Link
            href={getAdminPaths().site}
            target="_blank"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
          >
            Canli site
          </Link>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            type="button"
            onClick={() => {
              clearAdminToken();
              router.push(getAdminPaths().login);
            }}
            className="rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300"
          >
            Cikis
          </button>
        </div>
      </header>

      {(error || saved) && (
        <div className="border-b border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          {error ? <p className="text-red-600">{error}</p> : null}
          {saved ? <p className="text-emerald-700">Kaydedildi. Canli sitede gorunur.</p> : null}
        </div>
      )}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="overflow-y-auto border-r border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Bolum ekle
          </p>
          <div className="grid gap-2">
            {SECTION_PALETTE.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addSection(item.type)}
                className="rounded-xl border border-dashed border-zinc-300 px-3 py-3 text-left hover:border-amber-500 hover:bg-amber-50 dark:border-zinc-700 dark:hover:bg-amber-950/30"
              >
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  + {item.label}
                </span>
                <span className="text-xs text-zinc-500">{item.hint}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Hazir temalar
          </p>
          <div className="space-y-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                disabled={applyingTheme === theme.id}
                onClick={() => void handleApplyTheme(theme.id)}
                className={`w-full rounded-xl border p-2 text-left ${
                  settings.themeId === theme.id
                    ? 'border-zinc-900 dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div
                  className="mb-2 h-10 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${theme.previewAccent}, ${theme.previewAccent}99)`,
                  }}
                />
                <p className="text-sm font-medium">{theme.name}</p>
                <p className="text-[11px] text-zinc-500">{theme.description}</p>
              </button>
            ))}
          </div>
        </aside>

        <StoreEditorCanvas
          settings={settings}
          products={products}
          categories={categories}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={reorder}
          onToggle={toggleSection}
          onRemove={removeSection}
        />

        <aside className="overflow-hidden border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <StoreEditorInspector
            settings={settings}
            selectedId={selectedId}
            serverLogoUrl={serverLogoUrl}
            onChange={updateSettings}
            onServerLogoUrl={setServerLogoUrl}
          />
        </aside>
      </div>
    </div>
  );
}

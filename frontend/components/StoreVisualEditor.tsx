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

const chrome =
  'border-stone-200 bg-stone-50 text-stone-900 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-50';
const panel =
  'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950';
const btnGhost =
  'rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-900';
const btnPrimary =
  'rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 disabled:opacity-60';

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

  function handleProductCreated(product: Product) {
    setProducts((current) => [product, ...current]);
    const productsSection = settings?.sections.find((section) => section.type === 'products');
    if (productsSection) setSelectedId(productsSection.id);
    setSaved(false);
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
      <div className={`flex min-h-full items-center justify-center ${chrome}`}>
        <p className="text-sm text-stone-500">{error ?? 'Gorsel editor yukleniyor...'}</p>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] flex-col ${chrome}`}>
      <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${panel}`}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Magaza tasarimi
          </p>
          <h1 className="text-lg font-semibold tracking-tight">Sayfayi gorerek yerlestir</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={getAdminPaths().dashboard} className={btnGhost}>
            Urunler
          </Link>
          <Link href={getAdminPaths().site} target="_blank" className={btnGhost}>
            Canli site
          </Link>
          <button type="button" onClick={() => void handleSave()} disabled={saving} className={btnPrimary}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            type="button"
            onClick={() => {
              clearAdminToken();
              router.push(getAdminPaths().login);
            }}
            className="rounded-lg px-3 py-2 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          >
            Cikis
          </button>
        </div>
      </header>

      {(error || saved) && (
        <div className={`border-b px-4 py-2 text-sm ${panel}`}>
          {error ? <p className="text-red-600">{error}</p> : null}
          {saved ? <p className="text-emerald-700">Kaydedildi. Canli sitede gorunur.</p> : null}
        </div>
      )}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <aside className={`overflow-y-auto border-r p-3 ${panel}`}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Hizli islem
          </p>
          <div className="mb-5 grid gap-2">
            <button
              type="button"
              onClick={() => setSelectedId('__product__')}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                selectedId === '__product__'
                  ? 'border-amber-800 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40'
                  : 'border-dashed border-stone-300 hover:border-amber-700 hover:bg-amber-50/70 dark:border-stone-700 dark:hover:bg-amber-950/20'
              }`}
            >
              <span className="block text-sm font-semibold">+ Urun ekle</span>
              <span className="text-xs text-stone-500">Vitrine yeni urun koy</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedId('__style__')}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                selectedId === '__style__' || selectedId === '__header__'
                  ? 'border-amber-800 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40'
                  : 'border-dashed border-stone-300 hover:border-amber-700 hover:bg-amber-50/70 dark:border-stone-700 dark:hover:bg-amber-950/20'
              }`}
            >
              <span className="block text-sm font-semibold">Marka & yazi tipi</span>
              <span className="text-xs text-stone-500">Font, renk, logo</span>
            </button>
          </div>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Bolum ekle
          </p>
          <div className="grid gap-2">
            {SECTION_PALETTE.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addSection(item.type)}
                className="rounded-xl border border-dashed border-stone-300 px-3 py-3 text-left transition hover:border-amber-700 hover:bg-amber-50/70 dark:border-stone-700 dark:hover:bg-amber-950/20"
              >
                <span className="block text-sm font-medium">+ {item.label}</span>
                <span className="text-xs text-stone-500">{item.hint}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Hazir temalar
          </p>
          <div className="space-y-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                disabled={applyingTheme === theme.id}
                onClick={() => void handleApplyTheme(theme.id)}
                className={`w-full rounded-xl border p-2.5 text-left transition ${
                  settings.themeId === theme.id
                    ? 'border-stone-900 ring-1 ring-stone-900 dark:border-stone-100 dark:ring-stone-100'
                    : 'border-stone-200 hover:border-stone-400 dark:border-stone-800'
                }`}
              >
                <div
                  className="mb-2 h-9 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${theme.previewAccent}, ${theme.previewAccent}99)`,
                  }}
                />
                <p className="text-sm font-medium">{theme.name}</p>
                <p className="text-[11px] leading-snug text-stone-500">{theme.description}</p>
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

        <aside className={`overflow-hidden border-l ${panel}`}>
          <StoreEditorInspector
            settings={settings}
            selectedId={selectedId}
            serverLogoUrl={serverLogoUrl}
            products={products}
            categories={categories}
            onChange={updateSettings}
            onServerLogoUrl={setServerLogoUrl}
            onProductCreated={handleProductCreated}
          />
        </aside>
      </div>
    </div>
  );
}

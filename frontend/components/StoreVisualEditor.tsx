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
import type { EditorSelection } from '@/lib/editor-selection';
import StoreEditorCanvas from '@/components/StoreEditorCanvas';
import StoreEditorInspector from '@/components/StoreEditorInspector';

const emptyFeatures = [
  { title: '', text: '' },
  { title: '', text: '' },
  { title: '', text: '' },
  { title: '', text: '' },
];

const chrome = 'bg-zinc-100 text-zinc-900';
const panel = 'border-zinc-200 bg-white';
const btnGhost =
  'rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50';
const btnPrimary =
  'rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60';

export default function StoreVisualEditor() {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [themes, setThemes] = useState<StoreThemePreset[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverLogoUrl, setServerLogoUrl] = useState<string | null>(null);
  const [selection, setSelection] = useState<EditorSelection | null>(null);
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
          heroTextItemsOrder:
            store.heroTextItemsOrder && store.heroTextItemsOrder.length > 0
              ? store.heroTextItemsOrder
              : ['eyebrow', 'title', 'subtitle', 'ctas'],
          heroCtaButtonsOrder:
            store.heroCtaButtonsOrder && store.heroCtaButtonsOrder.length > 0
              ? store.heroCtaButtonsOrder
              : ['primary', 'secondary'],
          heroFeatureSide: store.heroFeatureSide === 'left' || store.heroFeatureSide === 'right'
            ? store.heroFeatureSide
            : 'right',
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
        setSelection({ type: 'section', sectionId: store.sections?.[0]?.id ?? 'hero' });
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

  function addSection(type: (typeof SECTION_PALETTE)[number]['type'], afterIndex?: number) {
    if (!settings) return;
    const section = createStoreSection(type);
    const list = [...settings.sections];
    const insertAt =
      afterIndex === undefined || afterIndex < 0 ? list.length : afterIndex + 1;
    list.splice(insertAt, 0, section);
    updateSettings({ ...settings, sections: list });
    setSelection({ type: 'section', sectionId: section.id });
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
    if (selection?.type === 'section' && selection.sectionId === id) {
      setSelection(next[0] ? { type: 'section', sectionId: next[0].id } : { type: 'none' });
    }
  }

  function handleProductCreated(product: Product) {
    setProducts((current) => [product, ...current]);
    const productsSection = settings?.sections.find((section) => section.type === 'products');
    if (productsSection) setSelection({ type: 'section', sectionId: productsSection.id });
    setSaved(false);
  }

  async function handleApplyTheme(themeId: StoreThemePreset['id']) {
    setApplyingTheme(themeId);
    setError(null);
    try {
      const updated = await adminApplyStoreTheme(themeId);
      setSettings({
        ...updated,
          heroTextItemsOrder:
            updated.heroTextItemsOrder && updated.heroTextItemsOrder.length > 0
              ? updated.heroTextItemsOrder
              : ['eyebrow', 'title', 'subtitle', 'ctas'],
          heroCtaButtonsOrder:
            updated.heroCtaButtonsOrder && updated.heroCtaButtonsOrder.length > 0
              ? updated.heroCtaButtonsOrder
              : ['primary', 'secondary'],
          heroFeatureSide:
            updated.heroFeatureSide === 'left' || updated.heroFeatureSide === 'right'
              ? updated.heroFeatureSide
              : 'right',
        featureCards:
          updated.featureCards.length > 0
            ? [...updated.featureCards, ...emptyFeatures].slice(0, 4)
            : emptyFeatures,
      });
      setServerLogoUrl(updated.logoUrl);
      setSaved(true);
      setSelection(
        updated.sections[0]
          ? { type: 'section', sectionId: updated.sections[0].id }
          : { type: 'none' },
      );
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
        heroTextItemsOrder:
          updated.heroTextItemsOrder && updated.heroTextItemsOrder.length > 0
            ? updated.heroTextItemsOrder
            : ['eyebrow', 'title', 'subtitle', 'ctas'],
        heroCtaButtonsOrder:
          updated.heroCtaButtonsOrder && updated.heroCtaButtonsOrder.length > 0
            ? updated.heroCtaButtonsOrder
            : ['primary', 'secondary'],
        heroFeatureSide:
          updated.heroFeatureSide === 'left' || updated.heroFeatureSide === 'right'
            ? updated.heroFeatureSide
            : 'right',
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Magaza tasarimi
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Sayfa editoru</h1>
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
            className="rounded-md px-3 py-2 text-sm text-zinc-500 hover:text-zinc-800"
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

      <div className="grid min-h-0 flex-1 lg:grid-cols-[240px_minmax(0,1fr)_minmax(300px,340px)]">
        <aside className={`min-h-0 overflow-y-auto border-r p-3 ${panel}`}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Hizli islem
          </p>
          <div className="mb-5 grid gap-2">
            <button
              type="button"
              onClick={() => setSelection({ type: 'product' })}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                selection?.type === 'product'
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-dashed border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50'
              }`}
            >
              <span className="block text-sm font-semibold">+ Urun ekle</span>
              <span className="text-xs text-zinc-500">Vitrine yeni urun koy</span>
            </button>
            <button
              type="button"
              onClick={() => setSelection({ type: 'style' })}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                selection?.type === 'style' || selection?.type === 'header'
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-dashed border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50'
              }`}
            >
              <span className="block text-sm font-semibold">Marka & yazi tipi</span>
              <span className="text-xs text-zinc-500">Font, renk, logo</span>
            </button>
          </div>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Bolum ekle
          </p>
          <div className="grid gap-2">
            {SECTION_PALETTE.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addSection(item.type)}
                className="rounded-lg border border-dashed border-zinc-300 px-3 py-3 text-left transition hover:border-zinc-500 hover:bg-zinc-50"
              >
                <span className="block text-sm font-medium">+ {item.label}</span>
                <span className="text-xs text-zinc-500">{item.hint}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Hazir temalar
          </p>
          <div className="space-y-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                disabled={applyingTheme === theme.id}
                onClick={() => void handleApplyTheme(theme.id)}
                className={`w-full rounded-lg border p-2.5 text-left transition ${
                  settings.themeId === theme.id
                    ? 'border-zinc-900 ring-1 ring-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <div
                  className="mb-2 h-9 rounded-md"
                  style={{
                    background: `linear-gradient(135deg, ${theme.previewAccent}, ${theme.previewAccent}99)`,
                  }}
                />
                <p className="text-sm font-medium">{theme.name}</p>
                <p className="text-[11px] leading-snug text-zinc-500">{theme.description}</p>
              </button>
            ))}
          </div>
        </aside>

        <StoreEditorCanvas
          settings={settings}
          products={products}
          categories={categories}
          selection={selection}
          onSelect={setSelection}
          onReorder={reorder}
          onToggle={toggleSection}
          onRemove={removeSection}
          onInsertSection={addSection}
          onTextChange={updateSettings}
        />

        <aside className={`flex min-h-0 flex-col overflow-hidden border-l ${panel}`}>
          <StoreEditorInspector
            settings={settings}
            selection={selection}
            serverLogoUrl={serverLogoUrl}
            products={products}
            categories={categories}
            onChange={updateSettings}
            onServerLogoUrl={setServerLogoUrl}
            onProductCreated={handleProductCreated}
            onRemoveSection={removeSection}
          />
        </aside>
      </div>
    </div>
  );
}

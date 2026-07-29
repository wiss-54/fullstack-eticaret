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
  getAdminToken,
} from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';
import { createStoreSection, SECTION_PALETTE } from '@/lib/store-sections';
import type { EditorSelection } from '@/lib/editor-selection';
import StoreEditorCanvas from '@/components/StoreEditorCanvas';
import StoreEditorInspector from '@/components/StoreEditorInspector';

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
          featureCards: store.featureCards?.length ? store.featureCards : [],
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
        featureCards: updated.featureCards ?? [],
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
        (card) => card.title.trim() || card.text.trim(),
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
        featureCards: updated.featureCards ?? [],
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
      <div className="flex h-full items-center justify-center bg-admin-bg text-admin-muted">
        <p className="font-admin-mono text-sm tracking-wide">
          {error ?? 'Gorsel editor yukleniyor...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-admin-bg text-admin-text">
      <header className="flex h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-admin-border bg-admin-surface-low px-4 md:px-8">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-admin-primary">Store Editor</h1>
          <p className="font-admin-mono text-[10px] uppercase tracking-[0.14em] text-admin-muted">
            Gorsel magaza duzenleyici
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={getAdminPaths().site}
            target="_blank"
            className="rounded border border-admin-border bg-admin-surface-high px-4 py-2 font-admin-mono text-xs font-semibold uppercase tracking-wide text-admin-text transition hover:bg-admin-surface"
          >
            Canli siteyi gor
          </Link>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded bg-admin-primary px-4 py-2 font-admin-mono text-xs font-semibold uppercase tracking-wide text-admin-on-primary-container transition hover:bg-admin-primary-container disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </header>

      {(error || saved) && (
        <div className="border-b border-admin-border bg-admin-surface-low px-4 py-2 text-sm md:px-8">
          {error ? <p className="text-admin-danger">{error}</p> : null}
          {saved ? (
            <p className="text-emerald-400">Kaydedildi. Canli sitede gorunur.</p>
          ) : null}
        </div>
      )}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[256px_minmax(0,1fr)_minmax(300px,340px)]">
        <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-admin-border bg-admin-surface py-4">
          <div className="border-b border-admin-border px-5 pb-4">
            <h2 className="text-lg font-bold text-admin-primary">Duzenleyici</h2>
            <p className="mt-1 font-admin-mono text-[10px] uppercase tracking-wider text-admin-muted">
              Gorsel kontroller
            </p>
          </div>

          <div className="space-y-1 px-3 py-4">
            <button
              type="button"
              onClick={() => setSelection({ type: 'product' })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                selection?.type === 'product'
                  ? 'border-r-4 border-admin-primary bg-admin-border/20 font-semibold text-admin-primary'
                  : 'text-admin-muted hover:bg-admin-border/10 hover:text-admin-text'
              }`}
            >
              <span className="text-sm font-medium">+ Urun ekle</span>
            </button>
            <button
              type="button"
              onClick={() => setSelection({ type: 'header' })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                selection?.type === 'header'
                  ? 'border-r-4 border-admin-primary bg-admin-border/20 font-semibold text-admin-primary'
                  : 'text-admin-muted hover:bg-admin-border/10 hover:text-admin-text'
              }`}
            >
              <span className="text-sm font-medium">Header / Marka</span>
            </button>
            <button
              type="button"
              onClick={() => setSelection({ type: 'footer' })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                selection?.type === 'footer'
                  ? 'border-r-4 border-admin-primary bg-admin-border/20 font-semibold text-admin-primary'
                  : 'text-admin-muted hover:bg-admin-border/10 hover:text-admin-text'
              }`}
            >
              <span className="text-sm font-medium">Footer / Alt bilgi</span>
            </button>
            <button
              type="button"
              onClick={() => setSelection({ type: 'style' })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                selection?.type === 'style'
                  ? 'border-r-4 border-admin-primary bg-admin-border/20 font-semibold text-admin-primary'
                  : 'text-admin-muted hover:bg-admin-border/10 hover:text-admin-text'
              }`}
            >
              <span className="text-sm font-medium">Yazi tipi & stil</span>
            </button>
          </div>

          <div className="px-5 pt-2">
            <p className="mb-2 font-admin-mono text-[10px] uppercase tracking-wider text-admin-muted">
              Bolum ekle
            </p>
            <div className="grid gap-2">
              {SECTION_PALETTE.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addSection(item.type)}
                  className="rounded-lg border border-dashed border-admin-border bg-admin-bg px-3 py-3 text-left transition hover:border-admin-primary hover:bg-admin-surface-low"
                >
                  <span className="block text-sm font-medium text-admin-text">+ {item.label}</span>
                  <span className="text-xs text-admin-muted">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 px-5 pb-4">
            <p className="mb-2 font-admin-mono text-[10px] uppercase tracking-wider text-admin-muted">
              Bolum listesi
            </p>
            <div className="flex flex-col gap-2">
              {settings.sections.map((section) => {
                const active =
                  selection?.type === 'section' && selection.sectionId === section.id;
                const label =
                  SECTION_PALETTE.find((item) => item.type === section.type)?.label ??
                  section.type;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSelection({ type: 'section', sectionId: section.id })}
                    className={`flex items-center justify-between rounded border px-3 py-2.5 text-left transition ${
                      active
                        ? 'border-admin-primary/50 bg-admin-bg'
                        : 'border-admin-border bg-admin-bg hover:border-admin-primary'
                    }`}
                  >
                    <span className="text-sm text-admin-text">{label}</span>
                    <span
                      className={`font-admin-mono text-[10px] uppercase ${
                        section.enabled ? 'text-admin-primary' : 'text-admin-muted'
                      }`}
                    >
                      {section.enabled ? 'Acik' : 'Kapali'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto border-t border-admin-border px-5 pt-4">
            <p className="mb-2 font-admin-mono text-[10px] uppercase tracking-wider text-admin-muted">
              Hazir temalar
            </p>
            <div className="space-y-2 pb-2">
              {themes.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={applyingTheme === preset.id}
                  onClick={() => void handleApplyTheme(preset.id)}
                  className={`w-full rounded-lg border p-2.5 text-left transition ${
                    settings.themeId === preset.id
                      ? 'border-admin-primary ring-1 ring-admin-primary'
                      : 'border-admin-border hover:border-admin-primary/60'
                  }`}
                >
                  <div
                    className="mb-2 h-9 rounded-md"
                    style={{
                      background: `linear-gradient(135deg, ${preset.previewAccent}, ${preset.previewAccent}99)`,
                    }}
                  />
                  <p className="text-sm font-medium text-admin-text">{preset.name}</p>
                  <p className="text-[11px] leading-snug text-admin-muted">{preset.description}</p>
                </button>
              ))}
            </div>
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

        <aside className="flex min-h-0 flex-col overflow-hidden border-l border-admin-border bg-admin-surface">
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
            onCategoriesChange={setCategories}
          />
        </aside>
      </div>
    </div>
  );
}

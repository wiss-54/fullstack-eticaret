'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminGetCategories,
  adminGetProduct,
  adminGetProducts,
  adminReorderProducts,
  adminUpdateProduct,
  getAdminToken,
} from '@/lib/admin-api';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import CategoryManager from '@/components/CategoryManager';
import type { Category, Product, ProductVariant, VariantAxis } from '@/lib/types';
import ProductImagesField from '@/components/ProductImagesField';
import ProductVariantsEditor from '@/components/ProductVariantsEditor';
import { getAdminPaths } from '@/lib/admin-paths';
import { safeMediaUrl } from '@/lib/safe-media-url';

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrls: string[];
  categoryId: string;
};

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageUrls: [],
  categoryId: '',
};

const fieldClass =
  'w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

function formatProductCode(id: number) {
  return `#PROD-${String(id).padStart(3, '0')}`;
}

function stockBadge(stock: number) {
  if (stock <= 0) {
    return {
      label: 'Tukendi',
      className: 'border border-admin-danger/30 bg-admin-danger/15 text-admin-danger',
      rowClassName: 'border-admin-danger/40 bg-admin-bg/80',
    };
  }
  if (stock <= 5) {
    return {
      label: `Azaldi (${stock})`,
      className: 'border border-admin-primary/25 bg-admin-primary-container/20 text-admin-primary',
      rowClassName: 'border-admin-border bg-admin-bg',
    };
  }
  return {
    label: `Stokta (${stock})`,
    className: 'border border-emerald-500/25 bg-emerald-500/15 text-emerald-600',
    rowClassName: 'border-admin-border bg-admin-bg',
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAxes, setEditingAxes] = useState<VariantAxis[]>([]);
  const [editingVariants, setEditingVariants] = useState<ProductVariant[]>([]);
  const [editingProductType, setEditingProductType] = useState<'simple' | 'variant'>('simple');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variantsEditorKey, setVariantsEditorKey] = useState(0);
  const [productQuery, setProductQuery] = useState('');
  const [reordering, setReordering] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      const haystack = [
        product.name,
        product.description,
        product.categoryName ?? '',
        String(product.id),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [products, productQuery]);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Urunler yuklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const paths = getAdminPaths();

    if (!getAdminToken()) {
      router.replace(paths.login);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          adminGetProducts(),
          adminGetCategories(),
        ]);
        if (!cancelled) {
          setProducts(productData);
          setCategories(categoryData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Urunler yuklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function startEdit(product: Product) {
    setEditingId(product.id);
    const initialImages =
      product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : product.imageUrl
          ? [product.imageUrl]
          : [];
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      imageUrls: initialImages,
      categoryId: product.categoryId ? String(product.categoryId) : '',
    });

    try {
      const fullProduct = await adminGetProduct(product.id);
      setEditingAxes(fullProduct.variantAxes ?? []);
      setEditingVariants(fullProduct.variants ?? []);
      setEditingProductType(fullProduct.productType ?? 'simple');
      const fullImages =
        fullProduct.imageUrls && fullProduct.imageUrls.length > 0
          ? fullProduct.imageUrls
          : fullProduct.imageUrl
            ? [fullProduct.imageUrl]
            : [];
      setForm((current) => ({
        ...current,
        stock: String(fullProduct.stock),
        categoryId: fullProduct.categoryId ? String(fullProduct.categoryId) : '',
        imageUrls: fullImages,
      }));
    } catch {
      setEditingAxes([]);
      setEditingVariants([]);
      setEditingProductType('simple');
    }
  }

  function resetForm() {
    setEditingId(null);
    setEditingAxes([]);
    setEditingVariants([]);
    setEditingProductType('simple');
    setForm(emptyForm);
  }

  async function moveProduct(productId: number, direction: -1 | 1) {
    if (productQuery.trim() || reordering) return;
    const index = products.findIndex((product) => product.id === productId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= products.length) return;

    const next = [...products];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setProducts(next);
    setReordering(true);
    setError(null);
    try {
      const saved = await adminReorderProducts(next.map((product) => product.id));
      setProducts(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Siralama kaydedilemedi');
      await loadProducts();
    } finally {
      setReordering(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const imageUrls = form.imageUrls.map((url) => url.trim()).filter(Boolean);
    const wantsVariants = editingProductType === 'variant';
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: wantsVariants ? 0 : Math.floor(Number(form.stock)),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      productType: wantsVariants ? ('variant' as const) : ('simple' as const),
    };

    try {
      if (editingId) {
        await adminUpdateProduct(editingId, payload);
        await loadProducts();
      } else {
        const created = await adminCreateProduct(payload);
        await loadProducts();
        if (wantsVariants) {
          await startEdit(created);
          setVariantsEditorKey((current) => current + 1);
        } else {
          resetForm();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayit basarisiz');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Bu urunu silmek istedigine emin misin?')) return;

    setError(null);
    try {
      await adminDeleteProduct(id);
      if (editingId === id) resetForm();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme basarisiz');
    }
  }

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 md:px-8 md:py-8">
      <AdminPageHeader
        title="Urun Yonetimi"
        description="Urun, varyant, stok ve kategori yonetimi"
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="relative overflow-hidden rounded-xl border border-admin-border bg-admin-surface-low p-5 shadow-sm xl:col-span-5">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-admin-primary-container to-transparent opacity-50" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-admin-primary">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" opacity="0.25" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </span>
              <h2 className="text-lg font-semibold text-admin-text">
                {editingId ? 'Urunu Duzenle' : 'Yeni Urun Ekle'}
              </h2>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin-primary-container/20 text-admin-primary">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <ProductImagesField
              values={form.imageUrls}
              onChange={(imageUrls) => setForm({ ...form, imageUrls })}
            />

            <label className="block space-y-1.5">
              <span className="text-sm text-admin-muted">Urun Adi</span>
              <input
                className={fieldClass}
                placeholder="Orn: Premium Kablosuz Kulaklik"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm text-admin-muted">Aciklama</span>
              <textarea
                className={`${fieldClass} min-h-24`}
                placeholder="Urun detaylarini giriniz..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm text-admin-muted">Kategori</span>
              <select
                className={fieldClass}
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Kategori Seciniz</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <span className="text-sm text-admin-muted">Urun Tipi</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setEditingProductType('simple')}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    editingProductType === 'simple'
                      ? 'border-admin-primary bg-admin-primary-container/20 text-admin-text'
                      : 'border-admin-border bg-admin-bg text-admin-muted hover:border-admin-primary'
                  }`}
                >
                  <p className="text-sm font-semibold">Basit urun</p>
                  <p className="mt-1 text-xs opacity-80">Tek fiyat, tek stok. Varyant yok.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProductType('variant')}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    editingProductType === 'variant'
                      ? 'border-admin-primary bg-admin-primary-container/20 text-admin-text'
                      : 'border-admin-border bg-admin-bg text-admin-muted hover:border-admin-primary'
                  }`}
                >
                  <p className="text-sm font-semibold">Varyantli urun</p>
                  <p className="mt-1 text-xs opacity-80">Renk, beden vb. secenek + ayri stok.</p>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm text-admin-muted">Fiyat (₺)</span>
                <input
                  className={fieldClass}
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-admin-muted">
                  {editingProductType === 'variant' ? 'Stok (varyantlardan)' : 'Stok Adedi'}
                </span>
                <input
                  className={fieldClass}
                  placeholder="0"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required={editingProductType !== 'variant'}
                  disabled={editingProductType === 'variant'}
                />
              </label>
            </div>

            {editingProductType === 'variant' ? (
              <p className="rounded-lg border border-admin-primary/25 bg-admin-primary-container/10 px-3 py-2 text-sm text-admin-primary">
                {editingId
                  ? 'Asagidan tek secenek turu sec (tisort=beden, saat=renk), degerleri ekle ve stok gir.'
                  : 'Kaydetten sonra tek varyant turunu (renk veya beden) burada ekleyebilirsin.'}
              </p>
            ) : null}

            <div className="flex justify-end gap-3 border-t border-admin-border pt-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-4 py-3 text-sm font-medium text-admin-muted hover:text-admin-text"
              >
                Vazgec
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-admin-primary-container px-5 py-3 text-sm font-semibold text-admin-on-primary-container transition hover:brightness-105 disabled:opacity-60"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>

          {editingId ? (
            <ProductVariantsEditor
              key={variantsEditorKey}
              productId={editingId}
              productName={form.name}
              initialAxes={editingAxes}
              initialVariants={editingVariants}
              onSaved={(axes, variants) => {
                setEditingAxes(axes);
                setEditingVariants(variants);
                setEditingProductType(variants.length > 0 ? 'variant' : 'simple');
                setVariantsEditorKey((current) => current + 1);
                void loadProducts();
              }}
            />
          ) : null}
        </section>

        <section className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-admin-border bg-admin-surface-low shadow-sm xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border bg-admin-bg/30 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin-surface-high text-admin-muted">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </span>
              <h2 className="text-lg font-semibold text-admin-text">Mevcut Urunler</h2>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <label className="relative min-w-[220px] flex-1 sm:w-72">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3-3" />
                  </svg>
                </span>
                <input
                  className="w-full rounded-full border border-admin-border bg-admin-bg py-2 pl-9 pr-3 text-sm text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
                  placeholder="Urun ara..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                />
              </label>
              <button
                type="button"
                aria-label="Filtre"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-admin-border bg-admin-bg text-admin-muted transition hover:border-admin-primary hover:text-admin-primary"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16" />
                  <path d="M7 12h10" />
                  <path d="M10 17h4" />
                </svg>
              </button>
            </div>
          </div>

          {error ? (
            <p className="mx-5 mt-4 rounded-lg border border-admin-danger/40 bg-admin-bg px-4 py-3 text-sm text-admin-danger">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="px-5 pt-6 text-admin-muted">Yukleniyor...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="px-5 pt-6 text-admin-muted">
              {products.length === 0
                ? 'Henuz urun yok. Soldan yeni urun ekleyebilirsin.'
                : 'Aramaya uygun urun bulunamadi.'}
            </p>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {filteredProducts.map((product, index) => {
                  const badge = stockBadge(product.stock);
                  const thumb = safeMediaUrl(product.imageUrls?.[0] ?? product.imageUrl);
                  const canReorder = !productQuery.trim();
                  return (
                    <div
                      key={product.id}
                      className={`group flex items-center gap-3 rounded-lg border p-3 transition hover:border-admin-primary/40 hover:bg-admin-surface-high/40 sm:gap-4 ${badge.rowClassName}`}
                    >
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        disabled={!canReorder || reordering || index === 0}
                        onClick={() => void moveProduct(product.id, -1)}
                        className="rounded border border-admin-border px-1.5 text-xs text-admin-muted hover:text-admin-text disabled:opacity-30"
                        title="Yukari tasi"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={!canReorder || reordering || index === filteredProducts.length - 1}
                        onClick={() => void moveProduct(product.id, 1)}
                        className="rounded border border-admin-border px-1.5 text-xs text-admin-muted hover:text-admin-text disabled:opacity-30"
                        title="Asagi tasi"
                      >
                        ↓
                      </button>
                    </div>
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-admin-border bg-admin-surface-high">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-admin-muted">
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <circle cx="9" cy="10" r="1.5" />
                            <path d="m21 16-4.5-4.5L9 19" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="line-clamp-2 text-sm font-semibold leading-5 text-admin-text">{product.name}</p>
                        {product.categoryName ? (
                          <span className="rounded-full border border-admin-border bg-admin-surface-high px-2 py-0.5 text-[11px] font-medium text-admin-muted">
                            {product.categoryName}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-semibold text-admin-text">{formatPrice(product.price)}</span>
                        <span className="font-admin-mono text-xs text-admin-muted">
                          ID: {formatProductCode(product.id)}
                        </span>
                        <span className="font-admin-mono text-[10px] uppercase tracking-wide text-admin-primary">
                          {product.productType === 'variant' ? 'Varyantli' : 'Basit'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`hidden shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold sm:inline-flex ${badge.className}`}
                    >
                      {badge.label}
                    </span>

                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => void startEdit(product)}
                          className="rounded-lg border border-admin-border px-3 py-1.5 text-sm text-admin-text transition hover:border-admin-primary"
                        >
                          Duzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(product.id)}
                          className="rounded-lg border border-admin-danger/50 px-3 py-1.5 text-sm text-admin-danger transition hover:bg-admin-danger/10"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-admin-border bg-admin-bg/30 px-5 py-4 text-sm text-admin-muted">
            <p>
              Toplam {products.length} Urun
              {productQuery.trim() ? ` · Gosterilen ${filteredProducts.length}` : ''}
            </p>
          </div>
        </section>
      </div>

      <CategoryManager />
    </main>
  );
}

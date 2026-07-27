'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Product, ProductOption, ProductVariant, VariantAxis } from '@/lib/types';
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminGetCategories,
  adminGetProduct,
  adminGetProducts,
  adminUpdateProduct,
  getAdminToken,
} from '@/lib/admin-api';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import CategoryManager from '@/components/CategoryManager';
import ProductImageField from '@/components/ProductImageField';
import ProductOptionsEditor from '@/components/ProductOptionsEditor';
import ProductVariantsEditor from '@/components/ProductVariantsEditor';
import { getAdminPaths } from '@/lib/admin-paths';
import { safeMediaUrl } from '@/lib/safe-media-url';

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  categoryId: string;
};

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
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
  const [editingOptions, setEditingOptions] = useState<ProductOption[]>([]);
  const [editingAxes, setEditingAxes] = useState<VariantAxis[]>([]);
  const [editingVariants, setEditingVariants] = useState<ProductVariant[]>([]);
  const [editingProductType, setEditingProductType] = useState<'simple' | 'variant'>('simple');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variantsEditorKey, setVariantsEditorKey] = useState(0);
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState('');

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
    setServerImageUrl(product.imageUrl);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl ?? '',
      categoryId: product.categoryId ? String(product.categoryId) : '',
    });

    try {
      const fullProduct = await adminGetProduct(product.id);
      setEditingOptions(fullProduct.options ?? []);
      setEditingAxes(fullProduct.variantAxes ?? []);
      setEditingVariants(fullProduct.variants ?? []);
      setEditingProductType(fullProduct.productType ?? 'simple');
      setForm((current) => ({
        ...current,
        stock: String(fullProduct.stock),
        categoryId: fullProduct.categoryId ? String(fullProduct.categoryId) : '',
      }));
    } catch {
      setEditingOptions([]);
      setEditingAxes([]);
      setEditingVariants([]);
      setEditingProductType('simple');
    }
  }

  function resetForm() {
    setEditingId(null);
    setServerImageUrl(null);
    setEditingOptions([]);
    setEditingAxes([]);
    setEditingVariants([]);
    setEditingProductType('simple');
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const imageUrl = form.imageUrl.trim();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Math.floor(Number(form.stock)),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      imageUrl: imageUrl || null,
    };

    try {
      if (editingId) {
        await adminUpdateProduct(editingId, payload);
      } else {
        await adminCreateProduct(payload);
      }
      resetForm();
      await loadProducts();
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
            <ProductImageField
              value={form.imageUrl}
              serverImageUrl={serverImageUrl}
              onChange={(imageUrl) => {
                setForm({ ...form, imageUrl });
                if (!imageUrl) setServerImageUrl(null);
              }}
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
                <span className="text-sm text-admin-muted">Stok Adedi</span>
                <input
                  className={fieldClass}
                  placeholder="0"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                  disabled={editingProductType === 'variant'}
                />
              </label>
            </div>

            {editingProductType === 'variant' ? (
              <p className="text-sm text-admin-primary">
                Varyantli urunlerde toplam stok, asagidaki matristeki satirlardan otomatik hesaplanir.
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
            <>
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
              <ProductOptionsEditor
                productId={editingId}
                initialOptions={editingOptions}
                onSaved={setEditingOptions}
              />
            </>
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
                {filteredProducts.map((product) => {
                  const badge = stockBadge(product.stock);
                  const thumb = safeMediaUrl(product.imageUrl);
                  return (
                    <div
                      key={product.id}
                      className={`group flex items-center gap-3 rounded-lg border p-3 transition hover:border-admin-primary/40 hover:bg-admin-surface-high/40 sm:gap-4 ${badge.rowClassName}`}
                    >
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

'use client';

import { FormEvent, useEffect, useState } from 'react';
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

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
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
          <section className="relative overflow-hidden rounded-xl border border-admin-border bg-admin-surface-low p-6 shadow-sm xl:col-span-5">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-admin-primary-container to-transparent opacity-50" />
            <h2 className="text-lg font-semibold text-admin-text">
              {editingId ? 'Urunu Duzenle' : 'Yeni Urun Ekle'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input
                className="w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
                placeholder="Urun adi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <textarea
                className="min-h-24 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
                placeholder="Aciklama"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <select
                className="w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/30 focus:ring-2"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Kategori sec (opsiyonel)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
                  placeholder="Temel fiyat"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
                <input
                  className="w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
                  placeholder="Stok"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                  disabled={editingProductType === 'variant'}
                />
              </div>
              {editingProductType === 'variant' ? (
                <p className="text-sm text-admin-primary">
                  Varyantli urunlerde toplam stok, asagidaki matristeki satirlardan otomatik hesaplanir.
                </p>
              ) : null}
              <ProductImageField
                value={form.imageUrl}
                serverImageUrl={serverImageUrl}
                onChange={(imageUrl) => {
                  setForm({ ...form, imageUrl });
                  if (!imageUrl) setServerImageUrl(null);
                }}
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-admin-primary-container px-4 py-3 text-sm font-semibold text-admin-on-primary-container disabled:opacity-60"
                >
                  {saving ? 'Kaydediliyor...' : editingId ? 'Guncelle' : 'Ekle'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-admin-border px-4 py-3 text-sm text-admin-muted"
                  >
                    Iptal
                  </button>
                ) : null}
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

          <section className="rounded-xl border border-admin-border bg-admin-surface-low p-6 shadow-sm xl:col-span-7">
            <h2 className="text-lg font-semibold text-admin-text">Urun Listesi</h2>

            {error ? (
              <p className="mt-4 rounded-lg border border-admin-danger/40 bg-admin-bg px-4 py-3 text-sm text-admin-danger">
                {error}
              </p>
            ) : null}

            {loading ? (
              <p className="mt-4 text-admin-muted">Yukleniyor...</p>
            ) : products.length === 0 ? (
              <p className="mt-4 text-admin-muted">Henuz urun yok. API&apos;den gelen urunler burada listelenir.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-admin-border bg-admin-bg p-4"
                  >
                    <div>
                      <p className="font-medium text-admin-text">{product.name}</p>
                      <p className="mt-1 text-sm text-admin-muted">
                        {formatPrice(product.price)} · Stok: {product.stock}
                        {product.categoryName ? ` · ${product.categoryName}` : ''}
                      </p>
                      <p className="mt-1 font-admin-mono text-xs uppercase tracking-wide text-admin-primary">
                        {product.productType === 'variant' ? 'Varyantli urun' : 'Basit urun'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void startEdit(product)}
                        className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-text hover:border-admin-primary"
                      >
                        Duzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product.id)}
                        className="rounded-lg border border-admin-danger/50 px-3 py-1 text-sm text-admin-danger"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <CategoryManager />
    </main>
  );
}

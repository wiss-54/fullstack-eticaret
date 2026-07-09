'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminGetProducts,
  adminUpdateProduct,
  clearAdminToken,
  getAdminToken,
} from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
};

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
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
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setLoading(true);
      setError(null);
      try {
        const data = await adminGetProducts();
        if (!cancelled) setProducts(data);
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

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl ?? '',
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim() || null,
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

  function handleLogout() {
    clearAdminToken();
    router.push(getAdminPaths().login);
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm font-medium text-zinc-500">Admin Panel</p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Urun Yonetimi
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={getAdminPaths().site}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
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

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {editingId ? 'Urunu Duzenle' : 'Yeni Urun Ekle'}
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Urun adi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <textarea
              className="min-h-24 w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Aciklama"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Fiyat"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Stok"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Gorsel URL (opsiyonel)"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {saving ? 'Kaydediliyor...' : editingId ? 'Guncelle' : 'Ekle'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700"
                >
                  Iptal
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Urun Listesi
          </h2>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="mt-4 text-zinc-500">Yukleniyor...</p>
          ) : products.length === 0 ? (
            <p className="mt-4 text-zinc-500">Henuz urun yok.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {product.name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatPrice(product.price)} · Stok: {product.stock}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
                    >
                      Duzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 dark:border-red-900 dark:text-red-300"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

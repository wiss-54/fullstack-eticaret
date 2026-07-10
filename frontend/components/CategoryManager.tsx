'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Category } from '@/lib/types';
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminGetCategories,
  adminUpdateCategory,
} from '@/lib/admin-api';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategoriler yuklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await adminUpdateCategory(editingId, { name: name.trim() });
      } else {
        await adminCreateCategory({ name: name.trim() });
      }
      resetForm();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Bu kategoriyi silmek istedigine emin misin?')) return;
    setError(null);
    try {
      await adminDeleteCategory(id);
      if (editingId === id) resetForm();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori silinemedi');
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Kategoriler</h2>
        <p className="mt-1 text-sm text-zinc-500">
          iKas ve Shopify magazalarinda oldugu gibi urunleri kategorilere ayir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input
          className="min-w-[220px] flex-1 rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Kategori adi (or. Tisort)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
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
      </form>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">Yukleniyor...</p>
      ) : (
        <div className="mt-4 space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-zinc-500">Henuz kategori yok.</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{category.name}</p>
                  <p className="text-xs text-zinc-500">/{category.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(category.id);
                      setName(category.name);
                    }}
                    className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
                  >
                    Duzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(category.id)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 dark:border-red-900 dark:text-red-300"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

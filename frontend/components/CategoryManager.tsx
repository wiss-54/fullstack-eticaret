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
    let cancelled = false;

    void (async () => {
      try {
        const data = await adminGetCategories();
        if (!cancelled) setCategories(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Kategoriler yuklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
    <section className="rounded-xl border border-admin-border bg-admin-surface-low p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-admin-text">Kategoriler</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Urunleri kategorilere ayir; filtreleme ve vitrin duzeni icin kullanilir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input
          className="min-w-[220px] flex-1 rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
          placeholder="Kategori adi (or. Tisort)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
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
      </form>

      {error ? (
        <p className="mt-4 rounded-lg border border-admin-danger/40 bg-admin-bg px-4 py-3 text-sm text-admin-danger">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-admin-muted">Yukleniyor...</p>
      ) : (
        <div className="mt-4 space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-admin-muted">Henuz kategori yok.</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border border-admin-border bg-admin-bg px-4 py-3"
              >
                <div>
                  <p className="font-medium text-admin-text">{category.name}</p>
                  <p className="font-admin-mono text-xs text-admin-muted">/{category.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(category.id);
                      setName(category.name);
                    }}
                    className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-text hover:border-admin-primary"
                  >
                    Duzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(category.id)}
                    className="rounded-lg border border-admin-danger/50 px-3 py-1 text-sm text-admin-danger"
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

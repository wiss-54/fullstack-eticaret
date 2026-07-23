'use client';

import { FormEvent, useState } from 'react';
import type { Category, Product } from '@/lib/types';
import { adminCreateProduct } from '@/lib/admin-api';
import ProductImageField from '@/components/ProductImageField';

type Props = {
  categories: Category[];
  onCreated: (product: Product) => void;
};

const inputClass =
  'w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text outline-none ring-admin-primary/30 focus:ring-2';

export default function StoreEditorQuickProduct({ categories, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);

    try {
      const created = await adminCreateProduct({
        name: name.trim(),
        description: description.trim() || name.trim(),
        price: Number(price),
        stock: Math.floor(Number(stock) || 0),
        categoryId: categoryId ? Number(categoryId) : null,
        imageUrl: imageUrl.trim() || null,
      });
      onCreated(created);
      setName('');
      setDescription('');
      setPrice('');
      setStock('10');
      setCategoryId('');
      setImageUrl('');
      setServerImageUrl(null);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Urun eklenemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-admin-text">Yeni urun ekle</p>
        <p className="mt-0.5 text-xs text-admin-muted">
          Kaydedince aninda vitrinde gorunur. Detayli varyant icin Urunler sayfasina git.
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-admin-muted">Urun adi</span>
        <input
          required
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Orn. Deri Cuzdan"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-admin-muted">Kisa aciklama</span>
        <textarea
          className={`${inputClass} min-h-16`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opsiyonel"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <span className="mb-1 block text-admin-muted">Fiyat (TL)</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="299"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-admin-muted">Stok</span>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-admin-muted">Kategori</span>
        <select
          className={inputClass}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Kategori yok</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      <ProductImageField
        value={imageUrl}
        serverImageUrl={serverImageUrl}
        onChange={(url) => {
          setImageUrl(url);
          if (!url) setServerImageUrl(null);
        }}
      />

      {error ? <p className="text-sm text-admin-danger">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-600">Urun eklendi. Vitrin guncellendi.</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-admin-primary-container px-3 py-2.5 text-sm font-medium text-admin-on-primary-container disabled:opacity-60"
      >
        {saving ? 'Ekleniyor...' : 'Urunu vitrine ekle'}
      </button>
    </form>
  );
}

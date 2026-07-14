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
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-amber-700/30 focus:ring-2 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50';

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
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">Yeni urun ekle</p>
        <p className="mt-0.5 text-xs text-stone-500">
          Kaydedince aninda vitrinde gorunur. Detayli varyant icin Urunler sayfasina git.
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-stone-500">Urun adi</span>
        <input
          required
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Orn. Deri Cuzdan"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-stone-500">Kisa aciklama</span>
        <textarea
          className={`${inputClass} min-h-16`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opsiyonel"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <span className="mb-1 block text-stone-500">Fiyat (TL)</span>
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
          <span className="mb-1 block text-stone-500">Stok</span>
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
        <span className="mb-1 block text-stone-500">Kategori</span>
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">Urun eklendi. Vitrin guncellendi.</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-stone-900 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-amber-800"
      >
        {saving ? 'Ekleniyor...' : 'Urunu vitrine ekle'}
      </button>
    </form>
  );
}

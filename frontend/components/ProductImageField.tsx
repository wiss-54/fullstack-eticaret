'use client';

import { useRef, useState } from 'react';
import { adminUploadImage } from '@/lib/admin-api';

type ProductImageFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Duzenlemede kayitli gorsel bilgisini gostermek icin (img src yapilmaz). */
  serverImageUrl?: string | null;
};

function toSafeUploadPath(imageUrl: string): string | null {
  if (!imageUrl.startsWith('/uploads/')) return null;
  const fileName = imageUrl.slice('/uploads/'.length).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!fileName || fileName.includes('..')) return null;
  return `/uploads/${fileName}`;
}

/**
 * Bilerek <img src={...}> kullanmiyoruz.
 * CodeQL js/xss-through-dom, form/DOM kaynakli string'i img src'e baglamayi
 * XSS kabul ediyor; onizlemeyi metin olarak gosteriyoruz.
 */
export default function ProductImageField({
  value,
  onChange,
  serverImageUrl = null,
}: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const statusPath = uploadedPath ?? (serverImageUrl ? toSafeUploadPath(serverImageUrl) : null);

  async function handleFileChange(file: File | null) {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await adminUploadImage(file);
      const safePath = toSafeUploadPath(result.imageUrl);
      if (!safePath) {
        throw new Error('Sunucu gecersiz gorsel yolu dondurdu');
      }
      setUploadedPath(safePath);
      onChange(safePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yukleme basarisiz');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleClear() {
    setUploadedPath(null);
    onChange('');
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Urun gorseli</p>
      <p className="text-xs text-zinc-500">
        PC&apos;den yukleyebilir veya dis URL yapistirabilirsin (JPEG/PNG/WEBP/GIF, max 5MB).
      </p>

      {statusPath || value ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
          <span className="break-all text-zinc-700 dark:text-zinc-300">
            {statusPath ?? value}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-red-600 dark:text-red-300"
          >
            Kaldir
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
        >
          {uploading ? 'Yukleniyor...' : 'Bilgisayardan yukle'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <input
        className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="veya gorsel URL yapistir (https://...)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

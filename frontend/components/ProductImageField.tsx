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
    <div className="space-y-3 rounded-lg border border-admin-border bg-admin-bg p-4">
      <p className="text-sm font-medium text-admin-text">Urun gorseli</p>
      <p className="text-xs text-admin-muted">
        PC&apos;den yukleyebilir veya dis URL yapistirabilirsin (JPEG/PNG/WEBP/GIF, max 5MB).
      </p>

      {statusPath || value ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-admin-surface-low px-3 py-2 text-sm">
          <span className="break-all text-admin-muted">{statusPath ?? value}</span>
          <button type="button" onClick={handleClear} className="shrink-0 text-admin-danger">
            Kaldir
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-admin-border px-4 py-2 text-sm text-admin-text disabled:opacity-60"
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
        className="w-full rounded-lg border border-admin-border bg-admin-surface px-4 py-3 text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
        placeholder="veya gorsel URL yapistir (https://...)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {error ? (
        <p className="rounded-lg border border-admin-danger/40 bg-admin-surface-low px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

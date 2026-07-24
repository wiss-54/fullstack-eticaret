'use client';

import { useRef, useState } from 'react';
import { adminUploadImage } from '@/lib/admin-api';
import { safeMediaUrl } from '@/lib/safe-media-url';

type ProductImageFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Duzenlemede kayitli gorsel bilgisini gostermek icin */
  serverImageUrl?: string | null;
};

function toSafeUploadPath(imageUrl: string): string | null {
  if (!imageUrl.startsWith('/uploads/')) return null;
  const fileName = imageUrl.slice('/uploads/'.length).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!fileName || fileName.includes('..')) return null;
  return `/uploads/${fileName}`;
}

export default function ProductImageField({
  value,
  onChange,
  serverImageUrl = null,
}: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);

  const statusPath = uploadedPath ?? (serverImageUrl ? toSafeUploadPath(serverImageUrl) : null);
  const previewSrc = safeMediaUrl(statusPath ?? value);

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
    <div className="space-y-3">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={`group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed px-4 py-8 transition disabled:opacity-60 ${
          previewSrc
            ? 'border-admin-primary/40 bg-admin-bg'
            : 'border-admin-border bg-admin-bg hover:border-admin-primary hover:bg-admin-surface-high/40'
        }`}
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt="Urun gorseli onizleme"
            className="mb-3 h-28 w-full max-w-xs rounded-lg object-cover"
          />
        ) : (
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-admin-surface-high text-admin-primary">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 16V8" />
              <path d="M8.5 11.5 12 8l3.5 3.5" />
              <path d="M20 16.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5" />
              <path d="M4 14.5 7.2 10l2.6 3.2L14 8l6 6.5" opacity="0.35" />
            </svg>
          </span>
        )}
        <p className="text-sm font-semibold text-admin-text">
          {uploading
            ? 'Yukleniyor...'
            : previewSrc
              ? 'Gorseli degistirmek icin tiklayin'
              : 'Gorsel Yuklemek icin Tiklayin'}
        </p>
        <p className="mt-1 text-xs text-admin-muted">PNG, JPG, WEBP (Maks. 5MB)</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowUrlField((open) => !open)}
          className="text-xs font-medium text-admin-muted underline-offset-2 hover:text-admin-primary hover:underline"
        >
          {showUrlField ? 'URL alanini gizle' : 'veya gorsel URL yapistir'}
        </button>
        {statusPath || value ? (
          <button type="button" onClick={handleClear} className="text-xs font-medium text-admin-danger">
            Gorseli kaldir
          </button>
        ) : null}
      </div>

      {showUrlField ? (
        <input
          className="w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-sm text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
          placeholder="https://... veya /uploads/..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}

      {error ? (
        <p className="rounded-lg border border-admin-danger/40 bg-admin-surface-low px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

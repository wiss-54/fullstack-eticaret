'use client';

import { useEffect, useRef, useState } from 'react';
import { adminUploadImage } from '@/lib/admin-api';

type ProductImageFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** API'den gelen kayitli gorsel — form text input'undan bagimsiz (CodeQL XSS-through-DOM). */
  serverImageUrl?: string | null;
};

function toSafeUploadPath(imageUrl: string): string | null {
  if (!imageUrl.startsWith('/uploads/')) return null;
  const fileName = imageUrl.slice('/uploads/'.length).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!fileName || fileName.includes('..')) return null;
  return `/uploads/${fileName}`;
}

function toSafeHttpUrl(imageUrl: string): string | null {
  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

function toServerPreview(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  return toSafeUploadPath(imageUrl) ?? toSafeHttpUrl(imageUrl);
}

/**
 * img src asla text input (DOM) degerinden set edilmez.
 * Onizleme: blob: (yerel dosya) veya sunucu /uploads|http(s) yolu.
 */
export default function ProductImageField({
  value,
  onChange,
  serverImageUrl = null,
}: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobPreview, setBlobPreview] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobPreview) URL.revokeObjectURL(blobPreview);
    };
  }, [blobPreview]);

  const serverPreview = toServerPreview(serverImageUrl);
  const previewSrc = blobPreview ?? uploadedPreview ?? serverPreview;

  async function handleFileChange(file: File | null) {
    if (!file) return;

    if (blobPreview) URL.revokeObjectURL(blobPreview);
    const objectUrl = URL.createObjectURL(file);
    setBlobPreview(objectUrl);
    setUploadedPreview(null);
    setUploading(true);
    setError(null);

    try {
      const result = await adminUploadImage(file);
      const safePath = toSafeUploadPath(result.imageUrl);
      if (!safePath) {
        throw new Error('Sunucu gecersiz gorsel yolu dondurdu');
      }
      setUploadedPreview(safePath);
      onChange(safePath);
      URL.revokeObjectURL(objectUrl);
      setBlobPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yukleme basarisiz');
      URL.revokeObjectURL(objectUrl);
      setBlobPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleClear() {
    if (blobPreview) URL.revokeObjectURL(blobPreview);
    setBlobPreview(null);
    setUploadedPreview(null);
    onChange('');
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Urun gorseli</p>
      <p className="text-xs text-zinc-500">
        PC&apos;den yukle (onizlemeli) veya https URL yapistir. Yapistirilan URL kayit edilir; onizleme
        sadece yuklenen / kayitli dosyada gosterilir.
      </p>

      {previewSrc ? (
        <div className="flex items-start gap-3">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Urun gorseli onizleme" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-red-600 dark:text-red-300"
          >
            Gorseli kaldir
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

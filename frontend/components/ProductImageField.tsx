'use client';

import { useRef, useState } from 'react';
import { adminUploadImage } from '@/lib/admin-api';
import { safeMediaUrl } from '@/lib/safe-media-url';

type ProductImageFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ProductImageField({ value, onChange }: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewSrc = safeMediaUrl(value);

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await adminUploadImage(file);
      onChange(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yukleme basarisiz');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Urun gorseli</p>
      <p className="text-xs text-zinc-500">PC&apos;den yukleyebilir veya dis URL yapistirabilirsin.</p>

      {previewSrc ? (
        <div className="flex items-start gap-3">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Urun gorseli onizleme" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm text-red-600 dark:text-red-300"
          >
            Gorseli kaldir
          </button>
        </div>
      ) : value.trim() ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Gecersiz gorsel adresi. http(s):// veya /uploads/ yolu kullan.
        </p>
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

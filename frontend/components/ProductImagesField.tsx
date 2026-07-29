'use client';

import { useRef, useState } from 'react';
import { adminUploadImage } from '@/lib/admin-api';
import { safeMediaUrl } from '@/lib/safe-media-url';

type ProductImagesFieldProps = {
  values: string[];
  onChange: (values: string[]) => void;
  maxImages?: number;
};

function toSafeUploadPath(imageUrl: string): string | null {
  if (!imageUrl.startsWith('/uploads/')) return null;
  const fileName = imageUrl.slice('/uploads/'.length).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!fileName || fileName.includes('..')) return null;
  return `/uploads/${fileName}`;
}

export default function ProductImagesField({
  values,
  onChange,
  maxImages = 8,
}: ProductImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const canAdd = values.length < maxImages;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxImages - values.length;
    if (remaining <= 0) return;

    setUploading(true);
    setError(null);

    try {
      const next = [...values];
      for (const file of Array.from(files).slice(0, remaining)) {
        const result = await adminUploadImage(file);
        const safePath = toSafeUploadPath(result.imageUrl);
        if (!safePath) throw new Error('Sunucu gecersiz gorsel yolu dondurdu');
        if (!next.includes(safePath)) next.push(safePath);
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yukleme basarisiz');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function addUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (values.length >= maxImages) {
      setError(`En fazla ${maxImages} gorsel eklenebilir`);
      return;
    }
    if (values.includes(trimmed)) {
      setError('Bu gorsel zaten ekli');
      return;
    }
    onChange([...values, trimmed]);
    setUrlDraft('');
    setError(null);
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-admin-text">
          Urun gorselleri ({values.length}/{maxImages})
        </p>
        <p className="text-xs text-admin-muted">Ilk gorsel kapak olur</p>
      </div>

      {values.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {values.map((url, index) => {
            const preview = safeMediaUrl(url);
            return (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-xl border border-admin-border bg-admin-bg"
              >
                <div className="flex aspect-square items-center justify-center bg-admin-surface-high">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt={`Gorsel ${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-xs text-admin-muted">Onizleme yok</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 border-t border-admin-border px-2 py-1.5">
                  <span className="text-[11px] text-admin-muted">
                    {index === 0 ? 'Kapak' : `#${index + 1}`}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="rounded px-1.5 text-xs text-admin-muted hover:text-admin-text disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === values.length - 1}
                      onClick={() => move(index, 1)}
                      className="rounded px-1.5 text-xs text-admin-muted hover:text-admin-text disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      className="rounded px-1.5 text-xs text-admin-danger"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        disabled={uploading || !canAdd}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-admin-border bg-admin-bg px-4 py-6 text-sm text-admin-muted transition hover:border-admin-primary hover:text-admin-primary disabled:opacity-50"
      >
        <span className="font-semibold text-admin-text">
          {uploading ? 'Yukleniyor...' : canAdd ? 'Gorsel ekle' : 'Limit doldu'}
        </span>
        <span className="mt-1 text-[11px]">PNG, JPG, WEBP — birden fazla secilebilir</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={() => setShowUrlField((open) => !open)}
        className="text-xs font-medium text-admin-muted underline-offset-2 hover:text-admin-primary hover:underline"
      >
        {showUrlField ? 'URL alanini gizle' : 'veya gorsel URL yapistir'}
      </button>

      {showUrlField ? (
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2"
            placeholder="https://... veya /uploads/..."
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
          />
          <button
            type="button"
            disabled={!canAdd}
            onClick={addUrl}
            className="rounded-lg border border-admin-border px-3 py-2 text-sm text-admin-text hover:border-admin-primary disabled:opacity-50"
          >
            Ekle
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-admin-danger/40 bg-admin-surface-low px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

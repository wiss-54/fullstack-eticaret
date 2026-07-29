'use client';

import { useState } from 'react';
import { safeMediaUrl } from '@/lib/safe-media-url';

type ProductImageGalleryProps = {
  images: string[];
  alt: string;
};

export default function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const safeImages = images.map((url) => safeMediaUrl(url)).filter((url): url is string => Boolean(url));
  const [activeIndex, setActiveIndex] = useState(0);
  const active = safeImages[activeIndex] ?? safeImages[0] ?? null;

  return (
    <div className="overflow-hidden rounded-lg bg-store-surface shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
      <div className="flex min-h-96 items-center justify-center bg-store-surface-low">
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-store-muted">Gorsel yok</span>
        )}
      </div>
      {safeImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-t border-store-border bg-store-surface p-3">
          {safeImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                index === activeIndex ? 'border-store-primary' : 'border-transparent'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

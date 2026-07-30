'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Props = {
  preview?: boolean;
};

export default function StoreSearch({ preview = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [open, setOpen] = useState(Boolean(urlQuery));
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
    if (urlQuery) setOpen(true);
  }

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (preview) return;
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/#urunler');
    setOpen(false);
  }

  if (preview) {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center text-store-muted" aria-hidden>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
      </span>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        aria-label="Urun ara"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next) setQuery(urlQuery);
            return next;
          });
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-store-text transition hover:bg-store-surface-low hover:text-store-primary"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
      </button>

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="absolute left-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-store-border bg-store-surface p-2 shadow-[0px_12px_30px_rgba(0,0,0,0.12)] sm:left-0"
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Urun ara..."
            className="w-full rounded-lg border border-store-border bg-store-bg px-3 py-2 text-sm text-store-text outline-none ring-store-primary/20 placeholder:text-store-muted focus:ring-2"
          />
        </form>
      ) : null}
    </div>
  );
}

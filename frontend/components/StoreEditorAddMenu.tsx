'use client';

import { useEffect, useRef } from 'react';
import type { StoreSection } from '@/lib/types';
import { SECTION_PALETTE } from '@/lib/store-sections';

type Props = {
  open: boolean;
  anchorLabel?: string;
  onClose: () => void;
  onPick: (type: StoreSection['type']) => void;
};

export default function StoreEditorAddMenu({ open, anchorLabel, onClose, onPick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-full z-30 mt-2 w-[min(92vw,280px)] -translate-x-1/2 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-stone-950"
    >
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {anchorLabel ?? 'Bolum ekle'}
      </p>
      <div className="grid gap-1">
        {SECTION_PALETTE.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => {
              onPick(item.type);
              onClose();
            }}
            className="rounded-xl px-3 py-2.5 text-left transition hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            <span className="block text-sm font-medium text-stone-900 dark:text-stone-50">
              {item.label}
            </span>
            <span className="text-xs text-stone-500">{item.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

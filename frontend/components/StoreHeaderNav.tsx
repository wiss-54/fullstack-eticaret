'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Category } from '@/lib/types';
import { getCategories } from '@/lib/api';
import { safeHref } from '@/lib/safe-href';

type Props = {
  navItem1Label: string;
  navItem1Href: string;
  navItem2Label: string;
  navItem2Href: string;
  categories?: Category[];
  preview?: boolean;
};

export default function StoreHeaderNav({
  navItem1Label,
  navItem1Href,
  navItem2Label,
  navItem2Href,
  categories: providedCategories = [],
  preview = false,
}: Props) {
  const [fetchedCategories, setFetchedCategories] = useState<Category[]>([]);
  const link1Href = safeHref(navItem1Href, '/#kategoriler');
  const link2Href = safeHref(navItem2Href, '/#urunler');
  const categories =
    providedCategories.length > 0 ? providedCategories : fetchedCategories;

  useEffect(() => {
    if (preview || providedCategories.length > 0) return;
    let cancelled = false;
    void getCategories()
      .then((list) => {
        if (!cancelled) setFetchedCategories(list);
      })
      .catch(() => {
        /* keep empty */
      });
    return () => {
      cancelled = true;
    };
  }, [preview, providedCategories.length]);

  if (preview) {
    return (
      <>
        <span>{navItem1Label}</span>
        <span>{navItem2Label}</span>
      </>
    );
  }

  return (
    <>
      <a href={link1Href} className="transition hover:text-store-primary">
        {navItem1Label}
      </a>

      <div className="group relative">
        <a
          href={link2Href}
          className="inline-flex items-center gap-1 transition hover:text-store-primary"
        >
          {navItem2Label}
          <svg className="h-3.5 w-3.5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.25 7.5 10 12.25 14.75 7.5" />
          </svg>
        </a>
        {categories.length > 0 ? (
          <div className="invisible absolute left-0 top-full z-50 min-w-[220px] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
            <div className="rounded-xl border border-store-border bg-store-surface py-2 shadow-[0px_12px_30px_rgba(0,0,0,0.12)]">
              <Link
                href="/"
                className="block px-4 py-2 text-sm text-store-muted transition hover:bg-store-surface-low hover:text-store-primary"
              >
                Tumu
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/?category=${category.id}`}
                  className="block px-4 py-2 text-sm text-store-text transition hover:bg-store-surface-low hover:text-store-primary"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

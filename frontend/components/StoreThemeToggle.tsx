'use client';

import { useStoreTheme } from '@/components/StoreThemeProvider';

export default function StoreThemeToggle() {
  const { theme, toggleTheme } = useStoreTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Gunduz moduna gec' : 'Gece moduna gec'}
      title={isDark ? 'Gunduz modu' : 'Gece modu'}
      className="inline-flex items-center gap-2 rounded-lg border border-store-border bg-store-surface px-2.5 py-2 text-store-muted transition hover:border-store-primary hover:text-store-primary"
    >
      {isDark ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M5 19l1.5-1.5" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 14.5A8.5 8.5 0 1 1 12.5 3 7 7 0 0 0 21 14.5Z" />
        </svg>
      )}
      <span className="hidden text-xs font-semibold sm:inline">
        {isDark ? 'Gunduz' : 'Gece'}
      </span>
    </button>
  );
}

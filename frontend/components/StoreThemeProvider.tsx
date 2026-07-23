'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type StoreTheme = 'light' | 'dark';

type StoreThemeContextValue = {
  theme: StoreTheme;
  setTheme: (theme: StoreTheme) => void;
  toggleTheme: () => void;
};

const THEME_KEY = 'store_theme';
const PREFS_EVENT = 'store-prefs-change';

const StoreThemeContext = createContext<StoreThemeContextValue | null>(null);

function readStoredTheme(): StoreTheme {
  const value = window.localStorage.getItem(THEME_KEY);
  return value === 'dark' ? 'dark' : 'light';
}

function notifyPrefsChange() {
  window.dispatchEvent(new Event(PREFS_EVENT));
}

function subscribePrefs(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(PREFS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(PREFS_EVENT, onStoreChange);
  };
}

export function StoreThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<StoreTheme>(subscribePrefs, readStoredTheme, () => 'light');

  const setTheme = useCallback((next: StoreTheme) => {
    window.localStorage.setItem(THEME_KEY, next);
    notifyPrefsChange();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = readStoredTheme() === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(THEME_KEY, next);
    notifyPrefsChange();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-store-theme', theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <StoreThemeContext.Provider value={value}>{children}</StoreThemeContext.Provider>;
}

export function useStoreTheme() {
  const ctx = useContext(StoreThemeContext);
  if (!ctx) {
    throw new Error('useStoreTheme must be used within StoreThemeProvider');
  }
  return ctx;
}

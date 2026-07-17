'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type AdminTheme = 'dark' | 'light';

type AdminThemeContextValue = {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
};

const THEME_KEY = 'admin_theme';
const SIDEBAR_KEY = 'admin_sidebar_collapsed';
const PREFS_EVENT = 'admin-prefs-change';

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

function readStoredTheme(): AdminTheme {
  const value = window.localStorage.getItem(THEME_KEY);
  return value === 'light' ? 'light' : 'dark';
}

function readStoredSidebar(): boolean {
  return window.localStorage.getItem(SIDEBAR_KEY) === '1';
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

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribePrefs, readStoredTheme, () => 'dark');
  const sidebarCollapsed = useSyncExternalStore(subscribePrefs, readStoredSidebar, () => false);

  const setTheme = useCallback((next: AdminTheme) => {
    window.localStorage.setItem(THEME_KEY, next);
    notifyPrefsChange();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = readStoredTheme() === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(THEME_KEY, next);
    notifyPrefsChange();
  }, []);

  const setSidebarCollapsed = useCallback((value: boolean) => {
    window.localStorage.setItem(SIDEBAR_KEY, value ? '1' : '0');
    notifyPrefsChange();
  }, []);

  const toggleSidebar = useCallback(() => {
    const next = !readStoredSidebar();
    window.localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
    notifyPrefsChange();
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
    }),
    [theme, sidebarCollapsed, setTheme, toggleTheme, toggleSidebar, setSidebarCollapsed],
  );

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error('useAdminTheme must be used within AdminThemeProvider');
  }
  return ctx;
}

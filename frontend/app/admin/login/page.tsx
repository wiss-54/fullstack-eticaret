'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, validateAdminSession } from '@/lib/admin-api';
import { getAdminPaths } from '@/lib/admin-paths';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paths = getAdminPaths();
    void validateAdminSession().then((valid) => {
      if (valid) router.replace(paths.dashboard);
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminLogin(username, password);
      router.push(getAdminPaths().dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giris basarisiz');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-full items-center justify-center bg-admin-bg px-6 py-16 font-admin-display text-admin-text"
      data-admin-theme="dark"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-admin-border bg-admin-surface p-8 shadow-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-admin-primary-container text-admin-on-primary-container">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V7a3 3 0 0 1 6 0v1" />
            </svg>
          </div>
          <div>
            <p className="font-admin-mono text-[10px] uppercase tracking-[0.2em] text-admin-muted">
              Yonetim
            </p>
            <h1 className="text-xl font-bold tracking-tight">EticaretShop</h1>
          </div>
        </div>
        <p className="text-sm text-admin-muted">Yonetim paneline giris</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-admin-muted">Kullanici adi</span>
            <input
              className="w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/40 focus:ring-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-admin-muted">Sifre</span>
            <input
              type="password"
              className="w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-3 text-admin-text outline-none ring-admin-primary/40 focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-admin-danger/40 bg-admin-bg px-4 py-3 text-sm text-admin-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-admin-primary-container px-4 py-3 font-semibold text-admin-on-primary-container transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Giriliyor...' : 'Giris Yap'}
        </button>
      </form>
    </div>
  );
}

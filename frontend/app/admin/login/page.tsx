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
    <div className="flex min-h-full items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-500">
          Yonetim
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
          Hatirani Yarat
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Yonetim paneline giris</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Kullanici adi</span>
            <input
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none ring-amber-700/40 focus:ring-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Sifre</span>
            <input
              type="password"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none ring-amber-700/40 focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-amber-700 px-4 py-3 font-medium text-white transition hover:bg-amber-600 disabled:opacity-60"
        >
          {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
        </button>
      </form>
    </div>
  );
}

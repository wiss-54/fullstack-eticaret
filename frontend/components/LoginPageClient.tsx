'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  customerLogin,
  customerResendVerificationEmail,
  EmailNotVerifiedError,
  validateCustomerSession,
} from '@/lib/customer-api';

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return') ?? '/hesabim';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    void validateCustomerSession().then((valid) => {
      if (valid) router.replace(returnTo);
    });
  }, [router, returnTo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    setNeedsVerification(false);

    try {
      await customerLogin(email, password);
      router.push(returnTo);
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        setNeedsVerification(true);
        setError(err.message);
        if (err.email) setEmail(err.email);
      } else {
        setError(err instanceof Error ? err.message : 'Giris basarisiz');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setInfo(null);

    try {
      const message = await customerResendVerificationEmail(email.trim());
      setInfo(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-posta gonderilemedi');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Hatira Niyarat</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Giris Yap</h1>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">E-posta</span>
            <input
              type="email"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none ring-amber-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Sifre</span>
            <input
              type="password"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none ring-amber-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {info ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {info}
          </p>
        ) : null}

        {needsVerification ? (
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendLoading || !email.trim()}
            className="mt-4 w-full rounded-xl border border-amber-800 px-4 py-3 font-medium text-amber-800 disabled:opacity-60 dark:border-amber-400 dark:text-amber-300"
          >
            {resendLoading ? 'Gonderiliyor...' : 'Dogrulama mailini tekrar gonder'}
          </button>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-amber-800 px-4 py-3 font-medium text-white transition hover:bg-amber-900 disabled:opacity-60 dark:bg-amber-500 dark:text-zinc-950"
        >
          {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Hesabin yok mu?{' '}
          <Link href={`/kayit?return=${encodeURIComponent(returnTo)}`} className="text-amber-800 hover:underline dark:text-amber-300">
            Kayit ol
          </Link>
        </p>
      </form>
    </main>
  );
}

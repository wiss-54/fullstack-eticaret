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

const fieldClass =
  'w-full rounded-lg border border-store-border bg-store-surface px-4 py-3 text-store-text outline-none transition focus:border-store-primary-container focus:ring-2 focus:ring-store-primary-container/20';

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
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-12 md:px-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-store-surface p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"
      >
        <p className="text-sm font-semibold text-store-primary">EticaretShop</p>
        <h1 className="mt-1 text-2xl font-bold text-store-text">Giris Yap</h1>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-store-text">E-posta</span>
            <input
              type="email"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-store-text">Sifre</span>
            <input
              type="password"
              className={fieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {info ? (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{info}</p>
        ) : null}

        {needsVerification ? (
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendLoading || !email.trim()}
            className="mt-4 w-full rounded-lg border border-store-primary px-4 py-3 font-semibold text-store-primary disabled:opacity-60"
          >
            {resendLoading ? 'Gonderiliyor...' : 'Dogrulama mailini tekrar gonder'}
          </button>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-store-primary-container px-4 py-3 font-semibold text-store-on-primary transition hover:bg-store-primary disabled:opacity-60"
        >
          {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
        </button>

        <p className="mt-4 text-center text-sm text-store-muted">
          Hesabin yok mu?{' '}
          <Link
            href={`/kayit?return=${encodeURIComponent(returnTo)}`}
            className="font-semibold text-store-primary hover:underline"
          >
            Kayit ol
          </Link>
        </p>
      </form>
    </main>
  );
}

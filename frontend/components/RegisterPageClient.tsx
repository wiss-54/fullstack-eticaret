'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  customerRegister,
  customerResendVerificationEmail,
  validateCustomerSession,
} from '@/lib/customer-api';

export default function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return') ?? '/hesabim';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    void validateCustomerSession().then((valid) => {
      if (valid) router.replace(returnTo);
    });
  }, [router, returnTo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await customerRegister({
        fullName,
        email,
        password,
        phone: phone.trim() || undefined,
      });
      setSuccessEmail(result.user.email);
      setSuccessMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayit basarisiz');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!successEmail) return;
    setResendLoading(true);
    setError(null);

    try {
      const message = await customerResendVerificationEmail(successEmail);
      setSuccessMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-posta gonderilemedi');
    } finally {
      setResendLoading(false);
    }
  }

  if (successEmail) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Hatira Niyarat</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">E-postani kontrol et</h1>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {successMessage ?? 'Kayit olusturuldu.'}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <strong>{successEmail}</strong> adresine dogrulama linki gonderdik. Linke tikladiktan sonra giris yapabilirsin.
          </p>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendLoading}
            className="mt-6 w-full rounded-xl border border-amber-800 px-4 py-3 font-medium text-amber-800 disabled:opacity-60 dark:border-amber-400 dark:text-amber-300"
          >
            {resendLoading ? 'Gonderiliyor...' : 'Dogrulama mailini tekrar gonder'}
          </button>

          <Link
            href={`/giris?return=${encodeURIComponent(returnTo)}`}
            className="mt-4 block w-full rounded-xl bg-amber-800 px-4 py-3 text-center font-medium text-white dark:bg-amber-500 dark:text-zinc-950"
          >
            Giris sayfasina git
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Hatira Niyarat</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Kayit Ol</h1>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Ad Soyad</span>
            <input
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">E-posta</span>
            <input
              type="email"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Telefon (opsiyonel)</span>
            <input
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Sifre</span>
            <input
              type="password"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-amber-800 px-4 py-3 font-medium text-white disabled:opacity-60 dark:bg-amber-500 dark:text-zinc-950"
        >
          {loading ? 'Kaydediliyor...' : 'Hesap Olustur'}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Zaten hesabin var mi?{' '}
          <Link href={`/giris?return=${encodeURIComponent(returnTo)}`} className="text-amber-800 hover:underline dark:text-amber-300">
            Giris yap
          </Link>
        </p>
      </form>
    </main>
  );
}

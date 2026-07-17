'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  customerResendVerificationEmail,
  customerVerifyEmail,
  validateCustomerSession,
} from '@/lib/customer-api';

export default function VerifyEmailPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const returnTo = searchParams.get('return') ?? '/hesabim';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    void validateCustomerSession().then((valid) => {
      if (valid) router.replace(returnTo);
    });
  }, [router, returnTo]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Dogrulama linki bulunamadi.');
      return;
    }

    void customerVerifyEmail(token)
      .then((result) => {
        setStatus('success');
        setMessage(result.message);
        window.setTimeout(() => router.replace(returnTo), 2000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'E-posta dogrulanamadi');
      });
  }, [token, router, returnTo]);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResendLoading(true);
    setResendMessage(null);

    try {
      const result = await customerResendVerificationEmail(resendEmail.trim());
      setResendMessage(result);
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : 'E-posta gonderilemedi');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Hatira Niyarat</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">E-posta Dogrulama</h1>

        {status === 'loading' ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">Dogrulama yapiliyor...</p>
        ) : null}

        {status === 'success' ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {message ?? 'E-posta adresiniz dogrulandi. Yonlendiriliyorsunuz...'}
          </p>
        ) : null}

        {status === 'error' ? (
          <>
            <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {message}
            </p>

            <form onSubmit={handleResend} className="mt-6 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Yeni dogrulama linki almak icin e-posta adresinizi girin:
              </p>
              <input
                type="email"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
              />
              <button
                type="submit"
                disabled={resendLoading}
                className="w-full rounded-xl bg-amber-800 px-4 py-3 font-medium text-white disabled:opacity-60 dark:bg-amber-500 dark:text-zinc-950"
              >
                {resendLoading ? 'Gonderiliyor...' : 'Dogrulama mailini tekrar gonder'}
              </button>
            </form>

            {resendMessage ? (
              <p className="mt-4 rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {resendMessage}
              </p>
            ) : null}
          </>
        ) : null}

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link href={`/giris?return=${encodeURIComponent(returnTo)}`} className="text-amber-800 hover:underline dark:text-amber-300">
            Giris sayfasina don
          </Link>
        </p>
      </div>
    </main>
  );
}

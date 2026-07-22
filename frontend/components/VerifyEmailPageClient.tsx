'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  customerResendVerificationEmail,
  customerVerifyEmail,
  validateCustomerSession,
} from '@/lib/customer-api';

const fieldClass =
  'w-full rounded-lg border border-store-border bg-store-surface px-4 py-3 text-store-text outline-none transition focus:border-store-primary-container focus:ring-2 focus:ring-store-primary-container/20';

export default function VerifyEmailPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const returnTo = searchParams.get('return') ?? '/hesabim';

  const hasToken = token.length > 0;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    hasToken ? 'loading' : 'error',
  );
  const [message, setMessage] = useState<string | null>(
    hasToken ? null : 'Dogrulama linki bulunamadi.',
  );
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    void validateCustomerSession().then((valid) => {
      if (valid) router.replace(returnTo);
    });
  }, [router, returnTo]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void customerVerifyEmail(token)
      .then((result) => {
        if (cancelled) return;
        setStatus('success');
        setMessage(result.message);
        window.setTimeout(() => router.replace(returnTo), 2000);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'E-posta dogrulanamadi');
      });

    return () => {
      cancelled = true;
    };
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
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-12 md:px-6">
      <div className="rounded-xl bg-store-surface p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <p className="text-sm font-semibold text-store-primary">EticaretShop</p>
        <h1 className="mt-1 text-2xl font-bold text-store-text">E-posta Dogrulama</h1>

        {status === 'loading' ? (
          <p className="mt-6 text-sm text-store-muted">Dogrulama yapiliyor...</p>
        ) : null}

        {status === 'success' ? (
          <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message ?? 'E-posta adresiniz dogrulandi. Yonlendiriliyorsunuz...'}
          </p>
        ) : null}

        {status === 'error' ? (
          <>
            <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>

            <form onSubmit={handleResend} className="mt-6 space-y-4">
              <p className="text-sm text-store-muted">
                Yeni dogrulama linki almak icin e-posta adresinizi girin:
              </p>
              <input
                type="email"
                className={fieldClass}
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
              />
              <button
                type="submit"
                disabled={resendLoading}
                className="w-full rounded-lg bg-store-primary-container px-4 py-3 font-semibold text-store-on-primary transition hover:bg-store-primary disabled:opacity-60"
              >
                {resendLoading ? 'Gonderiliyor...' : 'Dogrulama mailini tekrar gonder'}
              </button>
            </form>

            {resendMessage ? (
              <p className="mt-4 rounded-lg bg-store-surface-low px-4 py-3 text-sm text-store-muted">
                {resendMessage}
              </p>
            ) : null}
          </>
        ) : null}

        <p className="mt-6 text-center text-sm text-store-muted">
          <Link
            href={`/giris?return=${encodeURIComponent(returnTo)}`}
            className="font-semibold text-store-primary hover:underline"
          >
            Giris sayfasina don
          </Link>
        </p>
      </div>
    </main>
  );
}

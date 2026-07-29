'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  customerRegister,
  customerResendVerificationEmail,
  validateCustomerSession,
} from '@/lib/customer-api';
import { sanitizePhone, validatePhoneOptional } from '@/lib/phone';

const fieldClass =
  'w-full rounded-lg border border-store-border bg-store-surface px-4 py-3 text-store-text outline-none transition focus:border-store-primary-container focus:ring-2 focus:ring-store-primary-container/20';

export default function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return') ?? '/hesabim';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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

    if (password !== passwordConfirm) {
      setError('Sifreler eslesmiyor. Lutfen kontrol et.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Sifre en az 8 karakter olmali.');
      setLoading(false);
      return;
    }

    const normalizedPhone = sanitizePhone(phone);
    const phoneError = validatePhoneOptional(normalizedPhone);
    if (phoneError) {
      setError(phoneError);
      setLoading(false);
      return;
    }

    try {
      const result = await customerRegister({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: normalizedPhone || undefined,
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
      <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-12 md:px-6">
        <div className="rounded-xl bg-store-surface p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-semibold text-store-primary">EticaretShop</p>
          <h1 className="mt-1 text-2xl font-bold text-store-text">E-postani kontrol et</h1>
          <p className="mt-4 text-sm text-store-muted">{successMessage ?? 'Kayit olusturuldu.'}</p>
          <p className="mt-2 text-sm text-store-muted">
            <strong className="text-store-text">{successEmail}</strong> adresine dogrulama linki
            gonderdik. Linke tikladiktan sonra giris yapabilirsin.
          </p>

          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendLoading}
            className="mt-6 w-full rounded-lg border border-store-primary px-4 py-3 font-semibold text-store-primary disabled:opacity-60"
          >
            {resendLoading ? 'Gonderiliyor...' : 'Dogrulama mailini tekrar gonder'}
          </button>

          <Link
            href={`/giris?return=${encodeURIComponent(returnTo)}`}
            className="mt-4 block w-full rounded-lg bg-store-primary-container px-4 py-3 text-center font-semibold text-store-on-primary transition hover:bg-store-primary"
          >
            Giris sayfasina git
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-12 md:px-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-store-surface p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"
      >
        <p className="text-sm font-semibold text-store-primary">EticaretShop</p>
        <h1 className="mt-1 text-2xl font-bold text-store-text">Kayit Ol</h1>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-store-text">Ad Soyad</span>
            <input
              className={fieldClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

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
            <span className="mb-2 block text-sm font-semibold text-store-text">
              Telefon (opsiyonel)
            </span>
            <input
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(sanitizePhone(e.target.value))}
              autoComplete="tel"
              inputMode="numeric"
              pattern="[0-9]{10,11}"
              maxLength={11}
              placeholder="05XXXXXXXXX"
            />
            <p className="mt-1.5 text-xs text-store-muted">
              Opsiyonel. 10 veya 11 haneli, sadece rakam.
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-store-text">Sifre</span>
            <input
              type="password"
              className={fieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-store-text">Sifre tekrar</span>
            <input
              type="password"
              className={fieldClass}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-store-primary-container px-4 py-3 font-semibold text-store-on-primary transition hover:bg-store-primary disabled:opacity-60"
        >
          {loading ? 'Kaydediliyor...' : 'Hesap Olustur'}
        </button>

        <p className="mt-4 text-center text-sm text-store-muted">
          Zaten hesabin var mi?{' '}
          <Link
            href={`/giris?return=${encodeURIComponent(returnTo)}`}
            className="font-semibold text-store-primary hover:underline"
          >
            Giris yap
          </Link>
        </p>
      </form>
    </main>
  );
}

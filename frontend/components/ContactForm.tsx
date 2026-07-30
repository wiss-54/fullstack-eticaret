'use client';

import { FormEvent, useState } from 'react';
import { getApiBaseUrl } from '@/lib/config';

const fieldClass =
  'w-full rounded-md border border-store-text/80 bg-transparent px-4 py-3 text-sm text-store-text outline-none transition focus:border-store-primary focus:ring-2 focus:ring-store-primary/20';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          message: message.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? 'Mesaj gonderilemedi');
      }
      setSuccess('Mesajiniz alindi. En kisa surede donecegiz.');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mesaj gonderilemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mx-auto w-full max-w-xl space-y-5">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-store-text">Ad</span>
        <input
          className={fieldClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={120}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-store-text">
          E-posta <span className="text-store-primary">*</span>
        </span>
        <input
          type="email"
          className={fieldClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={200}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-store-text">Telefon numarasi</span>
        <input
          type="tel"
          className={fieldClass}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={40}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-store-text">Yorum</span>
        <textarea
          className={`${fieldClass} min-h-36 resize-y`}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          minLength={5}
          maxLength={2000}
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-store-primary-container px-8 py-3 text-sm font-bold uppercase tracking-[0.12em] text-store-on-primary transition hover:brightness-105 disabled:opacity-60"
      >
        {saving ? 'Gonderiliyor...' : 'Gonder'}
      </button>

      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

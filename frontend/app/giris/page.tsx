import { Suspense } from 'react';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import LoginPageClient from '@/components/LoginPageClient';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title="Giris Yap" />
      <Suspense fallback={<main className="px-6 py-12 text-center text-zinc-500">Yukleniyor...</main>}>
        <LoginPageClient />
      </Suspense>
      <StoreFooter />
    </div>
  );
}

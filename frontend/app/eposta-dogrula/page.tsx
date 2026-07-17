import { Suspense } from 'react';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import VerifyEmailPageClient from '@/components/VerifyEmailPageClient';

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title="E-posta Dogrulama" />
      <Suspense fallback={<main className="px-6 py-12 text-center text-zinc-500">Yukleniyor...</main>}>
        <VerifyEmailPageClient />
      </Suspense>
      <StoreFooter />
    </div>
  );
}

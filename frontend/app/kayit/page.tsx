import { Suspense } from 'react';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import RegisterPageClient from '@/components/RegisterPageClient';

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title="Kayit Ol" />
      <Suspense fallback={<main className="px-6 py-12 text-center text-zinc-500">Yukleniyor...</main>}>
        <RegisterPageClient />
      </Suspense>
      <StoreFooter />
    </div>
  );
}

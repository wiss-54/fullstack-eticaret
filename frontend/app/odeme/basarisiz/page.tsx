import { Suspense } from 'react';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import PaymentFailClient from '@/components/PaymentFailClient';

export default function PaymentFailPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title="Odeme" />
      <Suspense
        fallback={
          <main className="mx-auto max-w-lg px-6 py-16">
            <p className="text-zinc-500">Yukleniyor...</p>
          </main>
        }
      >
        <PaymentFailClient />
      </Suspense>
      <StoreFooter />
    </div>
  );
}

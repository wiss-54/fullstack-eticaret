import { Suspense } from 'react';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import MockCardPaymentClient from '@/components/MockCardPaymentClient';

export default function MockCardPaymentPage() {
  return (
    <div className="flex min-h-full flex-col bg-store-bg">
      <StoreHeader title="Kart Odeme" />
      <Suspense
        fallback={
          <main className="mx-auto max-w-lg px-6 py-16">
            <p className="text-zinc-500">Yukleniyor...</p>
          </main>
        }
      >
        <MockCardPaymentClient />
      </Suspense>
      <StoreFooter />
    </div>
  );
}

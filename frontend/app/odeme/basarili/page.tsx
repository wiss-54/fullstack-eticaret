import { Suspense } from 'react';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import PaymentSuccessClient from '@/components/PaymentSuccessClient';

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-full flex-col bg-store-bg">
      <StoreHeader title="Odeme" />
      <Suspense
        fallback={
          <main className="mx-auto max-w-lg px-6 py-16">
            <p className="text-zinc-500">Yukleniyor...</p>
          </main>
        }
      >
        <PaymentSuccessClient />
      </Suspense>
      <StoreFooter />
    </div>
  );
}

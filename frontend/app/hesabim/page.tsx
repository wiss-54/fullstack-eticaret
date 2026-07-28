import { Suspense } from 'react';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import AccountPageClient from '@/components/AccountPageClient';

export default function AccountPage() {
  return (
    <div className="flex min-h-full flex-col bg-store-bg">
      <StoreHeader title="Hesabim" />
      <Suspense
        fallback={
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 text-sm text-store-muted sm:px-6">
            Yukleniyor...
          </main>
        }
      >
        <AccountPageClient />
      </Suspense>
      <StoreFooter />
    </div>
  );
}

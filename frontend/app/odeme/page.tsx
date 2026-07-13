import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import CheckoutPageClient from '@/components/CheckoutPageClient';

export default function CheckoutPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title="Odeme" />
      <CheckoutPageClient />
      <StoreFooter />
    </div>
  );
}

import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import CheckoutPageClient from '@/components/CheckoutPageClient';

export default function CheckoutPage() {
  return (
    <div className="flex min-h-full flex-col bg-store-bg">
      <StoreHeader title="Odeme" />
      <CheckoutPageClient />
      <StoreFooter />
    </div>
  );
}

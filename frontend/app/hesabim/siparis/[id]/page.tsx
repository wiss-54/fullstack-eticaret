import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import OrderDetailPageClient from '@/components/OrderDetailPageClient';

export default function OrderDetailPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title="Siparis Detayi" />
      <OrderDetailPageClient />
      <StoreFooter />
    </div>
  );
}

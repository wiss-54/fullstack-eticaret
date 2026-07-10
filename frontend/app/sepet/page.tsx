import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import CartPageClient from '@/components/CartPageClient';

export default function CartPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title="Sepetim" />
      <CartPageClient />
      <StoreFooter />
    </div>
  );
}

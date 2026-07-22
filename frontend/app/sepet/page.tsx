import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import CartPageClient from '@/components/CartPageClient';

export default function CartPage() {
  return (
    <div className="flex min-h-full flex-col bg-store-bg">
      <StoreHeader title="Sepetim" />
      <CartPageClient />
      <StoreFooter />
    </div>
  );
}

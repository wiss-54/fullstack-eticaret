import StoreHeader from '@/components/StoreHeader';
import CartPageClient from '@/components/CartPageClient';

export default function CartPage() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <StoreHeader title="Sepetim" />
      <CartPageClient />
    </div>
  );
}

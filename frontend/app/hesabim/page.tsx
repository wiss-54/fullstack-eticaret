import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import AccountPageClient from '@/components/AccountPageClient';

export default function AccountPage() {
  return (
    <div className="flex min-h-full flex-col bg-store-bg">
      <StoreHeader title="Hesabim" />
      <AccountPageClient />
      <StoreFooter />
    </div>
  );
}

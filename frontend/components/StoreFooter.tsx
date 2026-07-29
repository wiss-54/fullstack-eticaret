type StoreFooterProps = {
  leftText?: string;
  rightText?: string;
  brandName?: string;
};

export default function StoreFooter({
  leftText = 'EticaretShop. Tum haklari saklidir.',
  rightText = 'Guvenli odeme altyapisi.',
  brandName = 'EticaretShop',
}: StoreFooterProps) {
  const left = leftText.includes(brandName)
    ? `© ${new Date().getFullYear()} ${leftText}`
    : `© ${new Date().getFullYear()} ${brandName}. ${leftText}`;

  return (
    <footer className="mt-auto border-t border-store-border bg-store-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-store-muted md:px-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-store-text">{left}</p>
        <p>{rightText}</p>
      </div>
    </footer>
  );
}

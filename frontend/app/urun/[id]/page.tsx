import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductImageGallery from '@/components/ProductImageGallery';
import ProductPurchasePanel from '@/components/ProductPurchasePanel';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import { getProduct, getStoreSettings } from '@/lib/api';
import { formatStorePrice } from '@/lib/format-price';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId < 1) {
    notFound();
  }

  let product;
  let settings;
  try {
    [product, settings] = await Promise.all([getProduct(productId), getStoreSettings()]);
  } catch {
    throw new Error('Ürün yüklenemedi');
  }

  if (!product) {
    notFound();
  }

  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  return (
    <div className="flex min-h-full flex-col bg-store-bg">
      <StoreHeader title={product.name} />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-10 md:px-10 lg:grid-cols-2">
        <ProductImageGallery images={images} alt={product.name} />

        <section className="rounded-lg bg-store-surface p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-store-accent-text">
            Urun detayi
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-store-text md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-3xl font-bold text-store-primary">
            {formatStorePrice(product.price, {
              currencyCode: settings.currencyCode,
              currencyDecimals: settings.currencyDecimals,
            })}
          </p>
          <p className="mt-4 leading-relaxed text-store-muted">{product.description}</p>

          <div className="mt-8 space-y-4">
            <ProductPurchasePanel
              product={product}
              currencyCode={settings.currencyCode}
              currencyDecimals={settings.currencyDecimals}
            />
            <Link
              href="/"
              className="inline-block rounded border border-store-border px-5 py-3 text-sm text-store-muted transition hover:border-store-primary hover:text-store-primary"
            >
              Urunlere Don
            </Link>
          </div>
        </section>
      </main>

      <StoreFooter
        brandName={settings.brandName}
        logoUrl={settings.logoUrl}
        leftText={settings.footerLeft}
        rightText={settings.footerRight}
        navItem2Href={settings.navItem2Href}
      />
    </div>
  );
}

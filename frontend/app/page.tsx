import ProductCard from '@/components/ProductCard';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import StoreHero from '@/components/StoreHero';
import { getProducts } from '@/lib/api';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch {
    error = 'Ürünler yüklenemedi. Backend çalışıyor mu kontrol et.';
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <StoreHeader title="Magazamiz" badge={`${products.length} urun`} />
      <StoreHero />

      <main id="urunler" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
              Koleksiyon
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">One cikan urunler</h2>
          </div>
          <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Her urun detayinda secenekler ve siparis notu alani bulunur. Admin panelden urun
            seceneklerini yonetebilirsin.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-12 text-center dark:border-amber-900/40 dark:bg-zinc-950">
            <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">Henuz urun yok</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Admin panelden urun ekleyince burada gorunecek.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}

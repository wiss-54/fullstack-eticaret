import ProductCard from '@/components/ProductCard';
import StoreHeader from '@/components/StoreHeader';
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
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <StoreHeader title="Magazamiz" badge={`${products.length} urun`} />

      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Kaliteli urunler, guvenli alisveris. Yeni eklenen urunler otomatik olarak bu sayfada
            guncellenir.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            Henuz urun yok. Admin panelden urun ekleyince burada gorunecek.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

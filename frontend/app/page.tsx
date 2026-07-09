import ProductCard from '@/components/ProductCard';
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
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm font-medium text-zinc-500">E-Ticaret</p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Ürünler
            </h1>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {products.length} ürün
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            Henüz ürün yok. Backend API&apos;ye ürün ekleyince burada görünecek.
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

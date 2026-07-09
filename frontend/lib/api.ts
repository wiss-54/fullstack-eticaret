import type { Product, ProductsResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/api/products`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Ürünler yüklenemedi');
  }

  const json: ProductsResponse = await response.json();
  return json.data;
}

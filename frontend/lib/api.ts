import type { Product, ProductsResponse } from './types';
import { API_URL } from './config';

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

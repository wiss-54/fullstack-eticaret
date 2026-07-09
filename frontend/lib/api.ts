import type { Product, ProductsResponse } from './types';
import { getApiBaseUrl } from './config';

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/products`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Ürünler yüklenemedi');
  }

  const json: ProductsResponse = await response.json();
  return json.data;
}

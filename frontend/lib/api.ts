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

export async function getProduct(id: number): Promise<Product | null> {
  const response = await fetch(`${getApiBaseUrl()}/api/products/${id}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Ürün yüklenemedi');
  }

  const json: { success: boolean; data: Product } = await response.json();
  return json.data;
}

import type { Category, Product, ProductsResponse } from './types';
import { getApiBaseUrl } from './config';

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/categories`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Kategoriler yuklenemedi');
  }

  const json: { success: boolean; data: Category[] } = await response.json();
  return json.data;
}

export async function getProducts(categoryId?: number): Promise<Product[]> {
  const query = categoryId ? `?categoryId=${categoryId}` : '';
  const response = await fetch(`${getApiBaseUrl()}/api/products${query}`, {
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

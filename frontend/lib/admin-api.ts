import type { Product } from './types';
import { getApiBaseUrl } from './config';

const TOKEN_KEY = 'admin_token';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
};

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? 'Istek basarisiz');
  }

  return json.data as T;
}

export async function adminLogin(username: string, password: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const json: ApiResponse<null> & { token?: string } = await response.json();

  if (!response.ok || !json.success || !json.token) {
    throw new Error(json.error ?? 'Giris basarisiz');
  }

  setAdminToken(json.token);
}

export async function adminGetProducts(): Promise<Product[]> {
  return adminFetch<Product[]>('/api/products');
}

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
};

export async function adminGetStatus() {
  return adminFetch<import('./types').SystemStatus>('/api/admin/status');
}

export async function adminCreateProduct(input: ProductInput) {
  return adminFetch<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function adminUpdateProduct(id: number, input: ProductInput) {
  return adminFetch<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function adminDeleteProduct(id: number) {
  const token = getAdminToken();
  const response = await fetch(`${getApiBaseUrl()}/api/products/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const json: ApiResponse<null> = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error ?? 'Silme basarisiz');
  }
}

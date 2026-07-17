import type { Order, User } from './types';
import { getApiBaseUrl } from './config';

const TOKEN_KEY = 'customer_token';

export class CustomerAuthError extends Error {
  constructor(message = 'Giris gerekli') {
    super(message);
    this.name = 'CustomerAuthError';
  }
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
  message?: string;
  code?: string;
};

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearCustomerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function customerFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getCustomerToken();
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

  if (response.status === 401) {
    clearCustomerToken();
    throw new CustomerAuthError(json.error ?? 'Giris gerekli');
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? 'Istek basarisiz');
  }

  return json.data as T;
}

export async function validateCustomerSession(): Promise<boolean> {
  if (!getCustomerToken()) return false;

  try {
    await customerFetch<User>('/api/auth/me');
    return true;
  } catch (error) {
    if (error instanceof CustomerAuthError) return false;
    throw error;
  }
}

export async function customerRegister(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const json: ApiResponse<User> = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error ?? 'Kayit basarisiz');
  }

  return {
    user: json.data as User,
    message: json.message ?? 'Kayit olusturuldu',
  };
}

export async function customerVerifyEmail(token: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const json: ApiResponse<User> & { token?: string; message?: string } = await response.json();
  if (!response.ok || !json.success || !json.token) {
    throw new Error(json.error ?? 'E-posta dogrulanamadi');
  }

  setCustomerToken(json.token);
  return {
    user: json.data as User,
    message: json.message ?? 'E-posta dogrulandi',
  };
}

export async function customerResendVerificationEmail(email: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const json: ApiResponse<null> = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error ?? 'E-posta gonderilemedi');
  }

  return json.message ?? 'Dogrulama e-postasi gonderildi';
}

export class EmailNotVerifiedError extends Error {
  email: string;

  constructor(message: string, email: string) {
    super(message);
    this.name = 'EmailNotVerifiedError';
    this.email = email;
  }
}

export async function customerLogin(email: string, password: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json: ApiResponse<User> & { token?: string; code?: string } = await response.json();
  if (response.status === 403 && json.code === 'EMAIL_NOT_VERIFIED') {
    throw new EmailNotVerifiedError(
      json.error ?? 'E-posta adresiniz dogrulanmamis',
      json.data?.email ?? email,
    );
  }

  if (!response.ok || !json.success || !json.token) {
    throw new Error(json.error ?? 'Giris basarisiz');
  }

  setCustomerToken(json.token);
  return json.data as User;
}

export async function customerGetMe() {
  return customerFetch<User>('/api/auth/me');
}

export type CreateOrderInput = {
  shippingCity: string;
  shippingDistrict: string;
  shippingAddressLine: string;
  customerPhone: string;
  orderNote?: string;
  paymentMethod?: 'manual' | 'cod' | 'paytr';
  items: {
    productId: number;
    variantId?: number | null;
    quantity: number;
    selectedOptions?: { optionId: number; label: string; value: string; priceDelta?: number }[];
    customerNote?: string;
  }[];
};

export type PaymentInitResult = {
  orderId: number;
  provider: string;
  token: string;
  paymentPageUrl: string;
  iframeToken: string | null;
};

export async function customerCreateOrder(input: CreateOrderInput) {
  return customerFetch<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function customerInitPayment(orderId: number) {
  return customerFetch<PaymentInitResult>('/api/payments/init', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function customerCompleteMockPayment(input: {
  orderId: number;
  token: string;
  success: boolean;
}) {
  return customerFetch<Order>('/api/payments/mock/complete', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function customerGetOrders() {
  return customerFetch<Order[]>('/api/orders');
}

export async function customerGetOrder(id: number) {
  return customerFetch<Order>(`/api/orders/${id}`);
}

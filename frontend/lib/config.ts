export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }

  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

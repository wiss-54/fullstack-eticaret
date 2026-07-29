export function sanitizePhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function validatePhoneOptional(phone: string): string | null {
  if (!phone) return null;
  if (!/^\d{10,11}$/.test(phone)) {
    return 'Telefon numarasi 10 veya 11 haneli olmali (ornek: 05XXXXXXXXX).';
  }
  return null;
}

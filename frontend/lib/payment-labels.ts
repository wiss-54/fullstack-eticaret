export function paymentMethodLabel(method: string) {
  switch (method) {
    case 'cod':
      return 'Kapida odeme';
    case 'manual':
      return 'Havale / EFT';
    case 'paytr':
      return 'Kredi / banka karti (PayTR)';
    case 'iyzico':
      return 'Kredi / banka karti';
    default:
      return method;
  }
}

export function paymentStatusLabel(status?: string | null) {
  switch (status) {
    case 'paid':
      return 'Odendi';
    case 'pending':
      return 'Odeme bekleniyor';
    case 'failed':
      return 'Odeme basarisiz';
    case 'cancelled':
      return 'Iptal';
    case 'unpaid':
    default:
      return 'Odenmedi';
  }
}

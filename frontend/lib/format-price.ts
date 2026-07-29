export type PriceFormatSettings = {
  currencyCode?: string | null;
  currencyDecimals?: number | null;
};

export function formatStorePrice(price: number, settings?: PriceFormatSettings) {
  const currency = (settings?.currencyCode || 'TRY').toUpperCase();
  const decimals =
    typeof settings?.currencyDecimals === 'number' && Number.isFinite(settings.currencyDecimals)
      ? Math.min(4, Math.max(0, Math.floor(settings.currencyDecimals)))
      : 2;

  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price);
  } catch {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price);
  }
}

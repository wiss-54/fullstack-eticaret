/**
 * Only allow safe image locations for use in <img src>.
 * Blocks javascript:/data: and other non-http schemes.
 */
export function safeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/uploads/')) {
    // Path traversal koruması: sadece tek seviye dosya adı
    if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('//')) {
      return null;
    }
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

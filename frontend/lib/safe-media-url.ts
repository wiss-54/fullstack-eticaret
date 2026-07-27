/**
 * Only allow safe image locations for use in <img src>.
 * Blocks javascript:/data: and other non-http schemes.
 */
export function safeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/uploads/')) {
    // Path traversal koruması: sadece tek seviye dosya adı; yolu yeniden kur.
    const fileName = trimmed.slice('/uploads/'.length).replace(/[^a-zA-Z0-9._-]/g, '');
    if (!fileName || fileName.includes('..')) {
      return null;
    }
    return `/uploads/${fileName}`;
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

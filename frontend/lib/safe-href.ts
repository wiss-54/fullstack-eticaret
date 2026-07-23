/**
 * Allow only relative paths, hash links, or http(s) URLs for <a href>.
 * Blocks javascript:, data:, and other schemes.
 */
export function safeHref(value: string | null | undefined, fallback = '#'): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    if (trimmed.includes('://') || trimmed.toLowerCase().includes('javascript:')) {
      return fallback;
    }
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return fallback;
    }
    return url.toString();
  } catch {
    return fallback;
  }
}

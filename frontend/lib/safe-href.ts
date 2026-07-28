/**
 * Allow only relative paths, hash links, or http(s) URLs for <a href>.
 * Blocks javascript:, data:, and other schemes.
 * Hash-only links become root hashes (e.g. #urunler -> /#urunler) so they work off the homepage.
 */
export function safeHref(value: string | null | undefined, fallback = '#'): string {
  if (!value) return normalizeHashHref(fallback);

  const trimmed = value.trim();
  if (!trimmed) return normalizeHashHref(fallback);

  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    if (trimmed.includes('://') || trimmed.toLowerCase().includes('javascript:')) {
      return normalizeHashHref(fallback);
    }
    return normalizeHashHref(trimmed);
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return normalizeHashHref(fallback);
    }
    return url.toString();
  } catch {
    return normalizeHashHref(fallback);
  }
}

function normalizeHashHref(href: string): string {
  if (href.startsWith('#') && href.length > 1) {
    return `/${href}`;
  }
  return href;
}

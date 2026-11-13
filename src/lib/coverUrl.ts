const GUTENBERG_HOSTS = new Set(['www.gutenberg.org', 'gutenberg.org', 'aleph.gutenberg.org']);

export function pickCoverSource(options: {
  coverImage?: string;
  formats?: Record<string, string>;
  sourceId?: string;
}): string {
  const fromFormats = options.formats?.['image/jpeg'] || options.formats?.['image/png'] || '';
  const raw = (options.coverImage || fromFormats || '').trim();
  if (raw) return raw;
  if (options.sourceId && /^\d+$/.test(options.sourceId)) {
    return `https://www.gutenberg.org/cache/epub/${options.sourceId}/pg${options.sourceId}.cover.medium.jpg`;
  }
  return '';
}

export function isAllowedCoverHost(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:' && GUTENBERG_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function proxiedCoverUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('/api/covers')) return raw;
  if (isAllowedCoverHost(raw)) {
    return `/api/covers?url=${encodeURIComponent(raw)}`;
  }
  return raw;
}

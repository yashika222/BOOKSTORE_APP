const HTML_KEYS = ['text/html; charset=utf-8', 'text/html'];
const EPUB_KEYS = ['application/epub+zip'];
const TEXT_KEYS = [
  'text/plain; charset=utf-8',
  'text/plain; charset=us-ascii',
  'text/plain',
];

function firstMatchingUrl(formats: Record<string, string> | undefined, keys: string[]): string | null {
  if (!formats) return null;
  for (const key of keys) {
    const url = formats[key];
    if (typeof url === 'string' && url.startsWith('http')) return url;
  }

  const fallbackKey = Object.keys(formats).find((key) =>
    keys.some((candidate) => key.startsWith(candidate.split(';')[0]))
  );
  const fallbackUrl = fallbackKey ? formats[fallbackKey] : undefined;
  return typeof fallbackUrl === 'string' && fallbackUrl.startsWith('http') ? fallbackUrl : null;
}

export function getEbookReadUrl(formats?: Record<string, string>): string | null {
  return firstMatchingUrl(formats, HTML_KEYS);
}

export function getEbookDownloadUrl(formats?: Record<string, string>): {
  url: string;
  label: string;
} | null {
  const epub = firstMatchingUrl(formats, EPUB_KEYS);
  if (epub) return { url: epub, label: 'EPUB' };
  const text = firstMatchingUrl(formats, TEXT_KEYS);
  if (text) return { url: text, label: 'Plain text' };
  return null;
}

export function isAllowedEbookHost(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'www.gutenberg.org' ||
        url.hostname === 'gutenberg.org' ||
        url.hostname === 'www.gutenberg.cc' ||
        url.hostname.endsWith('.gutenberg.org'))
    );
  } catch {
    return false;
  }
}

export function fileNameFromEbookUrl(urlString: string, title: string): string {
  try {
    const pathname = new URL(urlString).pathname;
    const last = pathname.split('/').filter(Boolean).pop() || 'ebook';
    if (last.includes('.')) return last;
  } catch {
    // Fall through to a sanitized title.
  }
  const safeTitle = title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `${safeTitle || 'ebook'}.epub`;
}

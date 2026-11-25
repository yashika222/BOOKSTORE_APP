export type BookSource = 'gutendex' | 'store';

export function bookDetailsHref(id: string | number, source: BookSource): string {
  return `/books/${encodeURIComponent(String(id))}?source=${source}`;
}

export function parseBookSource(value: string | null | undefined): BookSource | null {
  if (value === 'gutendex' || value === 'store') return value;
  return null;
}

export function inferBookSource(id: string, explicit?: string | null): BookSource {
  const parsed = parseBookSource(explicit);
  if (parsed) return parsed;
  return /^\d+$/.test(id) ? 'gutendex' : 'store';
}

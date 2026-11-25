export const DEFAULT_BOOK_PAGE_SIZE = 20;
export const MAX_BOOK_PAGE_SIZE = 20;

export function catalogPageSize(limit?: number): number {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_BOOK_PAGE_SIZE;
  return Math.min(MAX_BOOK_PAGE_SIZE, Math.max(1, Math.floor(parsed)));
}

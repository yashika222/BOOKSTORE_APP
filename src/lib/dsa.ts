
import { CartItem, ICommercialBook, WishlistItem } from "@/types";


export function calculateCartSummary(items: CartItem[]): { subtotal: number; totalQty: number } {
  return items.reduce(
    (accumulator, currentItem) => {
      const itemCost = currentItem.price * currentItem.qty;
      return {
        subtotal: Number((accumulator.subtotal + itemCost).toFixed(2)),
        totalQty: accumulator.totalQty + currentItem.qty,
      };
    },
    { subtotal: 0, totalQty: 0 }
  );
}


export function filterBooks<T extends { title: string; author?: string; genre?: string; price?: number }>(
  books: T[],
  query: string,
  genre?: string,
  maxPrice?: number
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  return books.filter((book) => {
    const matchesQuery =
      !normalizedQuery ||
      book.title.toLowerCase().includes(normalizedQuery) ||
      (book.author && book.author.toLowerCase().includes(normalizedQuery));

    const matchesGenre = !genre || genre === "all" || book.genre === genre;
    const matchesPrice = maxPrice === undefined || (book.price !== undefined && book.price <= maxPrice);

    return matchesQuery && matchesGenre && matchesPrice;
  });
}


export class WishlistSetManager {
  private idSet: Set<string | number>;

  constructor(initialItems: WishlistItem[] = []) {
    this.idSet = new Set(initialItems.map((item) => item.bookId));
  }

  has(bookId: string | number): boolean {
    return this.idSet.has(bookId);
  }

  add(item: WishlistItem, currentList: WishlistItem[]): WishlistItem[] {
    if (this.idSet.has(item.bookId)) {
      return currentList; // Duplicate prevented!
    }
    this.idSet.add(item.bookId);
    return [...currentList, item];
  }

  remove(bookId: string | number, currentList: WishlistItem[]): WishlistItem[] {
    this.idSet.delete(bookId);
    return currentList.filter((item) => item.bookId !== bookId);
  }
}


export class BookLookupMap {
  private cache: Map<string, ICommercialBook> = new Map();

  constructor(books: ICommercialBook[] = []) {
    books.forEach((book) => {
      if (book._id) this.cache.set(book._id, book);
      if (book.isbn) this.cache.set(book.isbn, book);
    });
  }

  get(key: string): ICommercialBook | undefined {
    return this.cache.get(key);
  }

  set(key: string, book: ICommercialBook): void {
    this.cache.set(key, book);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}


export class CartUndoStack<T> {
  private items: T[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  push(state: T): void {
    if (this.items.length >= this.maxSize) {
      this.items.shift(); // Evict oldest
    }
    this.items.push(state);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}

/**
 * Stack pagination:
 * each Next click pushes the newly fetched page (20 books) onto the stack.
 * Previous pops back to the last page without refetching it.
 */
export class PaginationStack<T> {
  private pages: T[][] = [];

  push(page: T[]): void {
    this.pages.push(page);
  }

  pop(): T[] | undefined {
    if (this.pages.length <= 1) {
      return this.peek();
    }
    this.pages.pop();
    return this.peek();
  }

  peek(): T[] {
    return this.pages[this.pages.length - 1] ?? [];
  }

  depth(): number {
    return this.pages.length;
  }

  reset(firstPage: T[] = []): void {
    this.pages = firstPage.length > 0 ? [firstPage] : [];
  }

  isEmpty(): boolean {
    return this.pages.length === 0;
  }
}


export interface QueuedOrderTask {
  orderId: string;
  userEmail: string;
  total: number;
  enqueuedAt: Date;
  status: 'queued' | 'processing' | 'completed';
}

export class OrderQueue {
  private queue: QueuedOrderTask[] = [];

  enqueue(orderId: string, userEmail: string, total: number): QueuedOrderTask {
    const task: QueuedOrderTask = {
      orderId,
      userEmail,
      total,
      enqueuedAt: new Date(),
      status: 'queued',
    };
    this.queue.push(task);
    return task;
  }

  dequeue(): QueuedOrderTask | undefined {
    return this.queue.shift();
  }

  peek(): QueuedOrderTask | undefined {
    return this.queue[0];
  }

  size(): number {
    return this.queue.length;
  }

  getPosition(orderId: string): number {
    const index = this.queue.findIndex((task) => task.orderId === orderId);
    return index === -1 ? -1 : index + 1;
  }

  getAll(): QueuedOrderTask[] {
    return [...this.queue];
  }
}

export interface CategoryTreeNode {
  title: string;
  key: string;
  icon?: string;
  children?: CategoryTreeNode[];
}

export const BOOKSTORE_CATEGORY_TREE: CategoryTreeNode[] = [
  {
    title: "Fiction & Literature",
    key: "fiction",
    children: [
      { title: "Classics", key: "classics" },
      { title: "Science Fiction", key: "sci-fi" },
      { title: "Mystery & Thriller", key: "mystery" },
      { title: "Fantasy & Adventure", key: "fantasy" },
      { title: "Historical Fiction", key: "historical" },
    ],
  },
  {
    title: "Non-Fiction",
    key: "non-fiction",
    children: [
      { title: "Science & Technology", key: "science" },
      { title: "Self-Help & Psychology", key: "self-help" },
      { title: "History & Biography", key: "history" },
      { title: "Philosophy & Society", key: "philosophy" },
    ],
  },
  {
    title: "Children & Young Adult",
    key: "children",
    children: [
      { title: "Fairy Tales & Fables", key: "fairy-tales" },
      { title: "Poetry & Plays", key: "poetry" },
    ],
  },
];

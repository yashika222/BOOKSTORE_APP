/**
 * Practical JavaScript & Data Structures Demonstration Module
 * 
 * This module demonstrates key Computer Science and JavaScript concepts
 * directly applied to the Bookstore domain without unnecessary over-engineering.
 * Used for viva explanations, code demonstrations, and real app logic.
 */

import { CartItem, ICommercialBook, WishlistItem } from "@/types";

// ==========================================
// 1. Array Higher-Order Functions: map, filter, reduce
// ==========================================

/**
 * Demonstrates reduce() to calculate cart subtotal and total quantities
 */
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

/**
 * Demonstrates filter() to filter books by keyword, genre, and price
 */
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

// ==========================================
// 2. Set: Fast Uniqueness & No Duplicates
// ==========================================

/**
 * Demonstrates Set for Wishlist duplicate prevention.
 * Ensures each book ID only exists once in O(1) membership check time.
 */
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

// ==========================================
// 3. Map: Key-Value Fast Lookup Cache
// ==========================================

/**
 * Demonstrates Map for O(1) in-memory fast book lookup by ID or ISBN.
 */
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

// ==========================================
// 4. Stack (LIFO - Last In, First Out)
// ==========================================

/**
 * Cart Undo Stack:
 * Whenever an item is deleted or updated in the cart,
 * the previous state is pushed to the stack.
 * When the user clicks "Undo", the top state is popped back.
 */
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

// ==========================================
// 5. Queue (FIFO - First In, First Out)
// ==========================================

/**
 * Order Processing Queue:
 * Simulates real-world order fulfillment where orders are processed
 * strictly in the order they arrived (First-Come, First-Served).
 */
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

// Global in-memory instance for demo order queue
export const globalOrderQueue = new OrderQueue();

// ==========================================
// 6. Tree: Category Hierarchy Navigation
// ==========================================

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

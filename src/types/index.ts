// TypeScript Type Definitions for Bookstore Application

// Gutendex Public Ebook Types
export interface GutendexAuthor {
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
}

export interface GutendexBook {
  id: number;
  title: string;
  authors: GutendexAuthor[];
  translators?: GutendexAuthor[];
  subjects: string[];
  bookshelves?: string[];
  languages: string[];
  copyright?: boolean | null;
  media_type?: string;
  formats: Record<string, string>;
  download_count: number;
}

export interface GutendexApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

// Commercial Book Types (for store sales, inventory, and MongoDB persistence)
export interface ICommercialBook {
  _id?: string;
  id?: string;
  isbn: string;
  title: string;
  author: string;
  description: string;
  price: number;
  stock: number;
  genre: string;
  category?: string;
  rating?: number;
  coverImage?: string;
  featured?: boolean;
  publishedYear?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Cart Item Type (supports both commercial books and demo Gutendex books)
export interface CartItem {
  bookId: string | number;
  isbn?: string;
  title: string;
  author: string;
  price: number;
  coverImage?: string;
  qty: number;
  stock?: number;
  isCommercial: boolean;
}

// Wishlist Item Type
export interface WishlistItem {
  bookId: string | number;
  title: string;
  author: string;
  coverImage?: string;
  price?: number;
  isCommercial: boolean;
  subjects?: string[];
}

// Order Types
export interface OrderItem {
  bookId: string | number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  coverImage?: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface IOrder {
  _id?: string;
  orderId: string;
  userId?: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  paymentMethod: string;
  queuePosition?: number;
  createdAt?: string;
}

// User / Auth Types
export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin';
  createdAt?: string;
}

export interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin';
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

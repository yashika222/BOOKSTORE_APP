import type {
  IAddress,
  ICommercialBook,
  IOrder,
  IUser,
  RecentlyViewedItem,
  ShippingAddress,
} from '@/types';

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  warning?: string;
  fallback?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface AuthResponse extends ApiEnvelope {
  user?: AuthUser;
  requiresOtp?: boolean;
  email?: string;
}

export interface MeResponse {
  success: boolean;
  user: AuthUser | null;
  message?: string;
}

export interface BookListParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  sortBy?: string;
  sortOrder?: string;
  language?: string;
  availability?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BookListResponse extends ApiEnvelope<ICommercialBook[]> {
  data: ICommercialBook[];
  pagination?: Pagination;
}

export interface BookResponse extends ApiEnvelope<ICommercialBook> {
  data?: ICommercialBook;
}

export interface RelatedBooksResponse extends ApiEnvelope<ICommercialBook[]> {
  data: ICommercialBook[];
}

export interface OrderListResponse extends ApiEnvelope<IOrder[]> {
  data: IOrder[];
}

export interface OrderResponse extends ApiEnvelope<IOrder> {
  order?: IOrder;
  data?: IOrder;
}

export interface AddressListResponse extends ApiEnvelope<IAddress[]> {
  data: IAddress[];
}

export interface AddressResponse extends ApiEnvelope<IAddress> {
  data?: IAddress;
}

export interface AccountUpdateResponse extends ApiEnvelope {
  user?: AuthUser;
}

export interface CreateOrderItemPayload {
  bookId: string | number;
  qty: number;
  isCommercial?: boolean;
}

export interface CreateOrderPayload {
  requestId?: string;
  items: CreateOrderItemPayload[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
  mobile?: string;
}

export interface UpdateProfilePayload {
  name: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export type AddressPayload = Omit<IAddress, '_id'>;

export interface RecentBooksResponse extends ApiEnvelope<RecentlyViewedItem[]> {
  data: RecentlyViewedItem[];
}

export interface GutendexResponse extends ApiEnvelope {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: unknown[];
  offlineFallback?: boolean;
}

export type User = IUser;

export type {
  IAddress,
  ICommercialBook,
  IOrder,
  IUser,
  OrderItem,
  RecentlyViewedItem,
  ShippingAddress,
  OrderStatus,
  CartItem,
  WishlistItem,
} from '@/types';

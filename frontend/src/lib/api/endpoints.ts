/**
 * Centralized backend Route Handler paths. Components and pages must not
 * hardcode these strings; use the API service modules instead.
 */

export const API_ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    verifyOtp: '/api/auth/verify-otp',
    resendOtp: '/api/auth/resend-otp',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    extendSession: '/api/auth/extend-session',
    google: '/api/auth/google',
    forgotPassword: '/api/auth/forgot-password',
    resetLink: '/api/auth/reset-link',
  },
  books: {
    list: '/api/books',
    byId: (id: string | number) => `/api/books/${encodeURIComponent(String(id))}`,
    byIsbn: (isbn: string) => `/api/books/isbn/${encodeURIComponent(isbn)}`,
    related: '/api/books/related',
  },
  cart: {
    root: '/api/cart',
    item: (itemId: string | number) => `/api/cart/${encodeURIComponent(String(itemId))}`,
  },
  wishlist: {
    root: '/api/wishlist',
    item: (bookId: string | number) => `/api/wishlist/${encodeURIComponent(String(bookId))}`,
  },
  orders: {
    root: '/api/orders',
    byId: (id: string) => `/api/orders/${encodeURIComponent(id)}`,
  },
  addresses: {
    root: '/api/addresses',
    byId: (id: string) => `/api/addresses/${encodeURIComponent(id)}`,
  },
  account: {
    root: '/api/account',
    recent: '/api/account/recent',
  },
  library: {
    gutendex: '/api/gutendex',
    covers: '/api/covers',
    ebookDownload: '/api/ebooks/download',
  },
  system: {
    health: '/api/health',
    openapi: '/openapi.json',
  },
} as const;

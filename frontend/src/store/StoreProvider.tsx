'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { AppStore, makeStore } from './index';
import { setCartItems } from './cartSlice';
import { setWishlistItems } from './wishlistSlice';
import { logout, setCredentials, setGuestMode } from './authSlice';
import { CartItem } from '@/types';
import {
  authService,
  cartService,
  wishlistService,
  clearSessionHint,
  setSessionHint,
} from '@/lib/api';
import QueryProvider from '@/lib/queryClient';

const GUEST_SESSION_KEY = 'bookstore_guest_mode';
const LEGACY_CART_STORAGE_KEY = 'bookstore_cart_v1';
const LEGACY_WISHLIST_STORAGE_KEY = 'bookstore_wishlist_v1';
const GUEST_CART_STORAGE_KEY = 'bookstore_cart_v2_guest';
const LEGACY_GUEST_WISHLIST = 'bookstore_wishlist_v2_guest';

const getUserStorageKeys = (userId: string) => ({
  cart: `bookstore_cart_v2_${userId}`,
  wishlist: `bookstore_wishlist_v2_${userId}`,
});

export default function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    let active = true;
    let activeUserId: string | null = null;
    let authInitialized = false;
    let hydratingUserData = false;
    let persistTimer: number | undefined;

    const readStoredItems = <T,>(key: string): T[] => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    };

    const mergeCarts = <T extends { bookId: string | number; qty: number; stock?: number }>(
      accountCart: T[],
      guestCart: T[]
    ): T[] => {
      const merged = accountCart.map((item) => ({ ...item }));

      for (const guestItem of guestCart) {
        const existing = merged.find((item) => String(item.bookId) === String(guestItem.bookId));
        if (!existing) {
          merged.push({ ...guestItem });
          continue;
        }

        const quantity = existing.qty + guestItem.qty;
        existing.qty =
          existing.stock !== undefined && existing.stock > 0
            ? Math.min(quantity, existing.stock)
            : quantity;
      }

      return merged;
    };

    const unsubscribe = store.subscribe(() => {
      if (!active || hydratingUserData) return;

      const state = store.getState();
      const authenticatedUser = state.auth.isAuthenticated && !state.auth.isGuest ? state.auth.user : null;

      if (authenticatedUser) {
        sessionStorage.removeItem(GUEST_SESSION_KEY);
      }

      if (!authenticatedUser) {
        activeUserId = null;
        if (authInitialized) {
          try {
            localStorage.setItem(
              GUEST_CART_STORAGE_KEY,
              JSON.stringify(store.getState().cart.items)
            );
          } catch {
            // Private browsing or a full storage quota must not block shopping.
          }
        }
        return;
      }

      if (activeUserId !== authenticatedUser.id) {
        activeUserId = authenticatedUser.id;
        const keys = getUserStorageKeys(authenticatedUser.id);
        const accountCart = readStoredItems<typeof state.cart.items[number]>(keys.cart);
        const guestCart = readStoredItems<typeof state.cart.items[number]>(GUEST_CART_STORAGE_KEY);
        const cart = mergeCarts(accountCart, guestCart);
        const wishlist = readStoredItems<typeof state.wishlist.items[number]>(keys.wishlist);
        hydratingUserData = true;
        store.dispatch(setCartItems(cart));
        store.dispatch(setWishlistItems(wishlist));
        hydratingUserData = false;
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      }

      try {
        const keys = getUserStorageKeys(authenticatedUser.id);
        const latestCart = store.getState().cart.items;
        const latestWishlist = store.getState().wishlist.items;
        localStorage.setItem(keys.cart, JSON.stringify(latestCart));
        localStorage.setItem(keys.wishlist, JSON.stringify(latestWishlist));
        if (persistTimer) window.clearTimeout(persistTimer);
        persistTimer = window.setTimeout(() => {
          void cartService.save(
            latestCart.map((item) => ({
              bookId: String(item.bookId),
              qty: item.qty,
            }))
          );
          void wishlistService.save(latestWishlist.map((item) => String(item.bookId)));
        }, 800);
      } catch {
        // Private browsing or a full storage quota must not block shopping.
      }
    });

    const initialize = async () => {
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      localStorage.removeItem(LEGACY_WISHLIST_STORAGE_KEY);
      localStorage.removeItem(LEGACY_GUEST_WISHLIST);
      const hadGuestSession = sessionStorage.getItem(GUEST_SESSION_KEY) === 'true';
      const guestCart = readStoredItems<CartItem>(GUEST_CART_STORAGE_KEY);

      try {
        const response = await authService.me();
        if (!active) return;

        authInitialized = true;
        if (response.success && response.user) {
          const currentCart = store.getState().cart.items;
          if (currentCart.length > 0) {
            localStorage.setItem(
              GUEST_CART_STORAGE_KEY,
              JSON.stringify(mergeCarts(guestCart, currentCart))
            );
          }
          setSessionHint(response.user);
          store.dispatch(
            setCredentials({
              user: response.user,
              sessionExpiresAt: response.sessionExpiresAt,
            })
          );
        } else {
          clearSessionHint();
          const currentCart = store.getState().cart.items;
          store.dispatch(hadGuestSession ? setGuestMode(true) : logout());
          store.dispatch(setCartItems(mergeCarts(guestCart, currentCart)));
        }
      } catch {
        if (!active) return;
        authInitialized = true;
        clearSessionHint();
        const currentCart = store.getState().cart.items;
        store.dispatch(hadGuestSession ? setGuestMode(true) : logout());
        store.dispatch(setCartItems(mergeCarts(guestCart, currentCart)));
      }
    };

    void initialize();

    return () => {
      active = false;
      if (persistTimer) window.clearTimeout(persistTimer);
      unsubscribe();
    };
  }, []);

  return (
    <Provider store={storeRef.current}>
      <QueryProvider>{children}</QueryProvider>
    </Provider>
  );
}

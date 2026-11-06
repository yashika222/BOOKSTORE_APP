'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { AppStore, makeStore } from './index';
import { setCartItems } from './cartSlice';
import { setWishlistItems } from './wishlistSlice';
import { logout, setCredentials, setGuestMode } from './authSlice';
import api from '@/lib/axios';

const GUEST_SESSION_KEY = 'bookstore_guest_mode';
const LEGACY_CART_STORAGE_KEY = 'bookstore_cart_v1';
const LEGACY_WISHLIST_STORAGE_KEY = 'bookstore_wishlist_v1';
const LEGACY_GUEST_CART = 'bookstore_cart_v2_guest';
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
    let hydratingUserData = false;

    const readStoredItems = <T,>(key: string): T[] => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    };

    const unsubscribe = store.subscribe(() => {
      if (!active || hydratingUserData) return;

      const state = store.getState();
      const authenticatedUser = state.auth.isAuthenticated && !state.auth.isGuest ? state.auth.user : null;

      if (authenticatedUser) {
        sessionStorage.removeItem(GUEST_SESSION_KEY);
      }

      if (!authenticatedUser) {
        return;
      }

      if (activeUserId !== authenticatedUser.id) {
        activeUserId = authenticatedUser.id;
        const keys = getUserStorageKeys(authenticatedUser.id);
        const cart = readStoredItems<typeof state.cart.items[number]>(keys.cart);
        const wishlist = readStoredItems<typeof state.wishlist.items[number]>(keys.wishlist);
        hydratingUserData = true;
        store.dispatch(setCartItems(cart));
        store.dispatch(setWishlistItems(wishlist));
        hydratingUserData = false;
      }

      try {
        const keys = getUserStorageKeys(authenticatedUser.id);
        localStorage.setItem(keys.cart, JSON.stringify(store.getState().cart.items));
        localStorage.setItem(keys.wishlist, JSON.stringify(store.getState().wishlist.items));
      } catch {
        // Private browsing or a full storage quota must not block shopping.
      }
    });

    const initialize = async () => {
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      localStorage.removeItem(LEGACY_WISHLIST_STORAGE_KEY);
      localStorage.removeItem(LEGACY_GUEST_CART);
      localStorage.removeItem(LEGACY_GUEST_WISHLIST);
      const hadGuestSession = sessionStorage.getItem(GUEST_SESSION_KEY) === 'true';

      try {
        const response = await api.get('/api/auth/me');
        if (!active) return;

        if (response.data?.success && response.data?.user) {
          store.dispatch(setCredentials({ user: response.data.user }));
        } else {
          store.dispatch(hadGuestSession ? setGuestMode(true) : logout());
        }
      } catch {
        if (!active) return;
        store.dispatch(hadGuestSession ? setGuestMode(true) : logout());
      }
    };

    void initialize();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}

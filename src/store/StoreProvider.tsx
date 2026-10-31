'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { AppStore, makeStore } from './index';
import { setCartItems } from './cartSlice';
import { setWishlistItems } from './wishlistSlice';
import { setCredentials, setLoading } from './authSlice';
import api from '@/lib/axios';

const CART_STORAGE_KEY = 'bookstore_cart_v1';
const WISHLIST_STORAGE_KEY = 'bookstore_wishlist_v1';

export default function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    // 1. Hydrate cart from localStorage
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          store.dispatch(setCartItems(parsed));
        }
      }
    } catch {
      // Ignore JSON parse errors
    }

    // 2. Hydrate wishlist from localStorage
    try {
      const storedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (storedWishlist) {
        const parsed = JSON.parse(storedWishlist);
        if (Array.isArray(parsed)) {
          store.dispatch(setWishlistItems(parsed));
        }
      }
    } catch {
      // Ignore JSON parse errors
    }

    // 3. Subscribe to store changes to persist cart & wishlist
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart.items));
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state.wishlist.items));
      } catch {
        // Storage limit or private mode error
      }
    });

    // 4. Verify auth session via /api/auth/me
    api
      .get('/api/auth/me')
      .then((res) => {
        if (res.data?.success && res.data?.user) {
          store.dispatch(setCredentials({ user: res.data.user }));
        } else {
          store.dispatch(setLoading(false));
        }
      })
      .catch(() => {
        store.dispatch(setLoading(false));
      });

    return () => {
      unsubscribe();
    };
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}

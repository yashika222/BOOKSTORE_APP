import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WishlistItem } from '@/types';
import { logout, setCredentials, setGuestMode } from './authSlice';

interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // Hydrate wishlist from localStorage on client mount
    setWishlistItems: (state, action: PayloadAction<WishlistItem[]>) => {
      state.items = action.payload;
    },

    // Add item to wishlist (Set uniqueness guarantee)
    addToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      // Set-based duplicate check
      const idSet = new Set(state.items.map((i) => String(i.bookId)));
      if (!idSet.has(String(action.payload.bookId))) {
        state.items.push(action.payload);
      }
    },

    // Remove item from wishlist
    removeFromWishlist: (state, action: PayloadAction<string | number>) => {
      state.items = state.items.filter(
        (item) => String(item.bookId) !== String(action.payload)
      );
    },

    // Toggle wishlist (if exists, remove; if not, add)
    toggleWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const idSet = new Set(state.items.map((i) => String(i.bookId)));
      const bookIdStr = String(action.payload.bookId);

      if (idSet.has(bookIdStr)) {
        state.items = state.items.filter((item) => String(item.bookId) !== bookIdStr);
      } else {
        state.items.push(action.payload);
      }
    },

    clearWishlist: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.items = [];
      })
      .addCase(setCredentials, (state) => {
        state.items = [];
      })
      .addCase(setGuestMode, (state) => {
        state.items = [];
      });
  },
});

export const {
  setWishlistItems,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;

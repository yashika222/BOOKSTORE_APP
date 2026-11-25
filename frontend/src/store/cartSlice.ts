import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '@/types';
import { logout, setCredentials, setGuestMode } from './authSlice';

interface CartState {
  items: CartItem[];
  // Stack for Undo functionality (LIFO)
  undoStack: CartItem[][];
}

const initialState: CartState = {
  items: [],
  undoStack: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Hydrate cart from localStorage on client mount
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },

    // Add item to cart or increment quantity if already present
    addToCart: (state, action: PayloadAction<CartItem>) => {
      if (action.payload.isCommercial && action.payload.stock !== undefined && action.payload.stock < 1) {
        return;
      }

      const existingIndex = state.items.findIndex(
        (item) => String(item.bookId) === String(action.payload.bookId)
      );

      if (existingIndex > -1) {
        const item = state.items[existingIndex];
        const newQty = item.qty + action.payload.qty;
        // Don't exceed stock if specified
        if (item.stock !== undefined && newQty > item.stock) {
          item.qty = item.stock;
        } else {
          item.qty = newQty;
        }
      } else {
        state.items.push(action.payload);
      }
    },

    // Remove single item and push snapshot to Undo Stack
    removeFromCart: (state, action: PayloadAction<string | number>) => {
      // 1. Push current snapshot to Undo Stack (Stack push)
      state.undoStack.push([...state.items]);
      if (state.undoStack.length > 10) {
        state.undoStack.shift(); // keep max 10 steps
      }

      // 2. Filter out deleted item
      state.items = state.items.filter(
        (item) => String(item.bookId) !== String(action.payload)
      );
    },

    // Update quantity of an item
    updateQuantity: (
      state,
      action: PayloadAction<{ bookId: string | number; qty: number }>
    ) => {
      const { bookId, qty } = action.payload;
      if (qty <= 0) {
        state.undoStack.push([...state.items]);
        state.items = state.items.filter(
          (item) => String(item.bookId) !== String(bookId)
        );
        return;
      }

      const item = state.items.find(
        (item) => String(item.bookId) === String(bookId)
      );
      if (item) {
        if (item.stock !== undefined && item.stock < 1) return;
        if (item.stock !== undefined && qty > item.stock) {
          item.qty = item.stock;
        } else {
          item.qty = qty;
        }
      }
    },

    // Undo last removal using Stack pop (LIFO)
    undoRemove: (state) => {
      const previousState = state.undoStack.pop(); // Stack pop
      if (previousState) {
        state.items = previousState;
      }
    },

    // Clear entire cart
    clearCart: (state) => {
      state.undoStack.push([...state.items]);
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.items = [];
        state.undoStack = [];
      })
      .addCase(setCredentials, (state) => {
        state.items = [];
        state.undoStack = [];
      })
      .addCase(setGuestMode, (state) => {
        state.items = [];
        state.undoStack = [];
      });
  },
});

export const {
  setCartItems,
  addToCart,
  removeFromCart,
  updateQuantity,
  undoRemove,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

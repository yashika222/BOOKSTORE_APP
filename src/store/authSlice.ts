import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '@/types';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  loading: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: { id: string; name: string; email: string; role: 'customer' | 'admin' };
        token?: string | null;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token || null;
      state.isAuthenticated = true;
      state.isGuest = false;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.loading = false;
    },
    setGuestMode: (state, action: PayloadAction<boolean>) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = action.payload;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, logout, setGuestMode, setLoading } = authSlice.actions;

export default authSlice.reducer;

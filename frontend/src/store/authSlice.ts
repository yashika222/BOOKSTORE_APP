import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '@/types';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  loading: true,
  sessionExpiresAt: null,
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
        sessionExpiresAt?: string | null;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token || null;
      state.isAuthenticated = true;
      state.isGuest = false;
      state.loading = false;
      state.sessionExpiresAt = action.payload.sessionExpiresAt || null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.loading = false;
      state.sessionExpiresAt = null;
    },
    setGuestMode: (state, action: PayloadAction<boolean>) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = action.payload;
      state.loading = false;
      state.sessionExpiresAt = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setSessionExpiresAt: (state, action: PayloadAction<string | null>) => {
      state.sessionExpiresAt = action.payload;
    },
  },
});

export const { setCredentials, logout, setGuestMode, setLoading, setSessionExpiresAt } =
  authSlice.actions;

export default authSlice.reducer;

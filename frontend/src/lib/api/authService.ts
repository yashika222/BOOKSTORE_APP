import api from './client';
import { API_BASE_URL } from './config';
import { API_ENDPOINTS } from './endpoints';
import type {
  ApiEnvelope,
  AuthResponse,
  LoginPayload,
  MeResponse,
  RegisterPayload,
} from './types';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(API_ENDPOINTS.auth.login, payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(API_ENDPOINTS.auth.register, payload);
    return data;
  },

  async verifyOtp(payload: { email: string; otp: string }): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(API_ENDPOINTS.auth.verifyOtp, payload);
    return data;
  },

  async resendOtp(email: string): Promise<ApiEnvelope> {
    const { data } = await api.post<ApiEnvelope>(API_ENDPOINTS.auth.resendOtp, { email });
    return data;
  },

  async me(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>(API_ENDPOINTS.auth.me);
    return data;
  },

  async logout(): Promise<ApiEnvelope> {
    const { data } = await api.post<ApiEnvelope>(API_ENDPOINTS.auth.logout);
    return data;
  },

  async forgotPassword(email: string): Promise<ApiEnvelope> {
    const { data } = await api.post<ApiEnvelope>(API_ENDPOINTS.auth.forgotPassword, { email });
    return data;
  },

  async verifyResetOtp(payload: { email: string; otp: string }): Promise<ApiEnvelope> {
    const { data } = await api.post<ApiEnvelope>(API_ENDPOINTS.auth.verifyResetOtp, payload);
    return data;
  },

  async resetPassword(payload: {
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiEnvelope> {
    const { data } = await api.post<ApiEnvelope>(API_ENDPOINTS.auth.resetPassword, payload);
    return data;
  },

  async resendResetPassword(email: string): Promise<ApiEnvelope> {
    const { data } = await api.post<ApiEnvelope>(API_ENDPOINTS.auth.resendResetPassword, {
      email,
    });
    return data;
  },

  /** Google OAuth starts on the backend origin, which owns the OAuth state cookie. */
  googleSignInUrl(nextPath?: string): string {
    const params = new URLSearchParams();
    if (nextPath) params.set('next', nextPath);
    const query = params.toString();
    return `${API_BASE_URL}${API_ENDPOINTS.auth.google}${query ? `?${query}` : ''}`;
  },
};

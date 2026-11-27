import axios, { isAxiosError, isCancel } from 'axios';
import { API_BASE_URL } from './config';

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * The single Axios instance used by the whole frontend.
 * Credentials are required because the backend owns the HTTP-only auth cookie.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function isCanceledRequest(error: unknown): boolean {
  if (isCancel(error)) return true;
  if (!isAxiosError(error) && error instanceof Error) {
    return error.message === 'canceled' || error.name === 'CanceledError' || error.name === 'AbortError';
  }
  if (isAxiosError(error)) {
    return error.code === 'ERR_CANCELED' || error.message === 'canceled';
  }
  return false;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isCanceledRequest(error)) {
      return Promise.reject(error);
    }

    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      !String(error.config?.url || '').includes('/api/auth/')
    ) {
      window.dispatchEvent(new Event('bookstore:session-expired'));
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error instanceof Error ? error.message : '') ||
      'An unexpected network or server error occurred.';

    return Promise.reject(new ApiError(message, error.response?.status, error.response?.data));
  }
);

export default api;

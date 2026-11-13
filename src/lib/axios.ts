import axios, { isAxiosError, isCancel } from 'axios';


const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error extraction
function isCanceledRequest(error: unknown): boolean {
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
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error instanceof Error ? error.message : '') ||
      'An unexpected network or server error occurred.';

    return Promise.reject(new Error(message));
  }
);

export { isCanceledRequest };

export default api;

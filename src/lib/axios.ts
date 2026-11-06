import axios from 'axios';

/**
 * Centralized Axios instance configured for application API requests.
 * Uses relative URL for browser calls to avoid hardcoding localhost.
 * Enables withCredentials for HTTP-only cookie support.
 */
const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network or server error occurred.';

    return Promise.reject(new Error(message));
  }
);

export default api;

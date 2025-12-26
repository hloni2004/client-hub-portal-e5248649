import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://e-commerce-7lqm.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Use cookies for auth; ensure server sets HttpOnly cookies on login
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});


// Attach JWT token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    try {
      // Zustand store may not be available at import time, so get token dynamically
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore errors if store is not initialized
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;


    if (error.response?.status === 401 && !originalRequest._retry) {
      // Optionally, redirect to login on 401
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }

    // Handle 403 (forbidden) by logging a warning. Do not auto-redirect — let the caller decide.
    if (error.response?.status === 403) {
      console.warn('Request forbidden (403) - authentication may have expired');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

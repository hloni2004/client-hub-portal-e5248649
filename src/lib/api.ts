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


    const status = error.response?.status;

    // Try to refresh token for 401 or 403 responses (only once per request)
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      // If the failing request is an auth endpoint (login/register/refresh/logout/password flows)
      // do NOT attempt a refresh. For example: login returning 401 should immediately reject so
      // the UI can show a validation error and stop any loading state instead of getting queued.
      const failingUrl = originalRequest.url || originalRequest.originalUrl || '';
      if (failingUrl.includes('/users/login') || failingUrl.includes('/users/register') || failingUrl.includes('/users/refresh') || failingUrl.includes('/users/logout') || failingUrl.includes('/users/reset') || failingUrl.includes('/users/forgot') || failingUrl.includes('/users/password')) {
        return Promise.reject(error);
      }

      // Mark request as retried to avoid loops
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshResponse = await apiClient.post('/users/refresh');
          // Expect backend to return new access token in body
          const newAccess = refreshResponse.data?.accessToken ?? null;
          const refreshedUser = refreshResponse.data?.user ?? null;

          if (newAccess) {
            // Use setter to update auth store (keeps reactivity and ensures token isn't persisted)
            try {
              useAuthStore.getState().setToken(newAccess);
              if (refreshedUser) useAuthStore.getState().setUser(refreshedUser);
            } catch (e) {
              console.warn('Could not update auth store after refresh', e);
            }

            processQueue(null, newAccess);
          } else {
            // No token returned — fail refresh and clear client state
            processQueue(new Error('No access token returned from refresh'), null);
            try { useAuthStore.getState().clearAuth('refresh_failed'); } catch (e) {}
            if (!window.location.pathname.includes('/auth/login')) {
              window.location.href = '/auth/login?sessionExpired=1';
            }
            return Promise.reject(error);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          try { useAuthStore.getState().clearAuth('refresh_failed'); } catch (e) {}
          if (!window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login?sessionExpired=1';
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      // Queue this request until refresh is done
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            // Update header and retry
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;

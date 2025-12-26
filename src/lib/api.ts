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
      // Mark request as retried to avoid loops
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshResponse = await apiClient.post('/users/refresh');
          // Expect backend to return new access token in body
          const newAccess = refreshResponse.data?.accessToken ?? null;

          if (newAccess) {
            // Update in-memory token store
            try {
              useAuthStore.getState().token = newAccess;
              useAuthStore.getState().isAuthenticated = true;
            } catch (e) {
              console.warn('Could not update auth store after refresh', e);
            }

            processQueue(null, newAccess);
          } else {
            // No token returned — fail refresh
            processQueue(new Error('No access token returned from refresh'), null);
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/auth/login')) {
              window.location.href = '/auth/login';
            }
            return Promise.reject(error);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          if (!window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login';
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

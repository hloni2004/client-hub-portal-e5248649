import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginDto, RegisterDto } from '@/types';
import apiClient from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  clearAuth: (reason?: string) => Promise<void>;
  tryRestoreSession: () => Promise<void>;
  updateProfile: (userId: number, data: Partial<User>) => Promise<void>;
  changePassword: (userId: number, oldPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Set token in memory only and update isAuthenticated
      setToken: (token: string | null) => {
        set({ token, isAuthenticated: !!token });
      },

      // Try to restore session by calling refresh endpoint (should be called on app start)
      tryRestoreSession: async () => {
        try {
          const response = await apiClient.post('/users/refresh');
          const newAccess = response.data?.accessToken ?? null;
          const refreshedUser = response.data?.user ?? null;

          if (newAccess) {
            // Persist user but keep token in memory
            set({ user: refreshedUser ?? get().user });
            get().setToken(newAccess);
            set({ isAuthenticated: true });
          } else {
            // No access token -> clear persisted user to avoid stale UI
            set({ user: null, token: null, isAuthenticated: false });
            try { localStorage.removeItem('auth-storage'); } catch (e) {}
          }
        } catch (e) {
          // On error, clear client state
          set({ user: null, token: null, isAuthenticated: false });
          try { localStorage.removeItem('auth-storage'); } catch (e) {}
          throw e;
        }
      },

      login: async (data: LoginDto) => {
        try {
          const response = await apiClient.post('/users/login', data);
          const resp = response.data as any;
          const user: User = resp.user;
          const token: string | null = resp.accessToken ?? null;

          // Save only non-sensitive user info to persistent storage and keep token in memory
          set({ user });
          get().setToken(token);
          set({ isAuthenticated: true });

          // After login, sync any locally-stored cart items to the server
          try {
            const { useCartStore } = await import('./ecommerce/cartStore');
            await useCartStore.getState().syncLocalToServer();
          } catch (e) {
            console.error('Error syncing local cart after login', e);
          }
        } catch (error: any) {
          // If backend returns error, do not set user state
          let message = error.response?.data?.message || error.message || 'Login failed';
          throw new Error(message);
        }
      },

      register: async (data: RegisterDto) => {
        await apiClient.post('/users/register', data);
        // Do NOT sign in user after registration
      },

      logout: async () => {
        try {
          await apiClient.post('/users/logout');
        } catch (e) {
          // ignore errors during logout
        }

        // Clear client state and persisted storage
        set({ user: null, token: null, isAuthenticated: false });

        // Clear cart store and persisted cart data so next user doesn't see previous user's cart
        try {
          const { useCartStore } = await import('./ecommerce/cartStore');
          useCartStore.getState().clearCart();
        } catch (e) {
          console.warn('Could not clear cart store on logout', e);
        }

        try {
          localStorage.removeItem('luxury-cart-storage');
          localStorage.removeItem('auth-storage');
        } catch (e) {
          // ignore localStorage errors
        }
      },

      // Clears auth state without calling the API (used when refresh fails)
      clearAuth: async (reason?: string) => {
        set({ user: null, token: null, isAuthenticated: false });
        try {
          const { useCartStore } = await import('./ecommerce/cartStore');
          useCartStore.getState().clearCart();
        } catch (e) {
          // ignore
        }
        try {
          localStorage.removeItem('luxury-cart-storage');
          localStorage.removeItem('auth-storage');
        } catch (e) {}
      },

      setUser: (user: User) => {
        set({ user });
      },

      updateProfile: async (userId: number, data: Partial<User>) => {
        await apiClient.put(`/users/${userId}/profile`, data);
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      changePassword: async (userId: number, oldPassword: string, newPassword: string) => {
        await apiClient.put(`/users/${userId}/password`, {
          oldPassword,
          newPassword,
        });
      },
    }),
    {
      name: 'auth-storage',
      // Persist only non-sensitive user profile. Token stays in memory only.
      partialize: (state) => ({ user: state.user }),
    }
  )
);

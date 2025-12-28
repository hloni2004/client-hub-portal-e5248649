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
  updateProfile: (userId: number, data: Partial<User>) => Promise<void>;
  changePassword: (userId: number, oldPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (data: LoginDto) => {
        const response = await apiClient.post('/users/login', data);
        const resp = response.data as any;
        const user: User = resp.user;
        const token: string | null = resp.accessToken ?? null;
        // Only store non-sensitive user info in memory (not localStorage)
        set({ user, token, isAuthenticated: true });

        // After login, sync any locally-stored cart items to the server
        try {
          const { useCartStore } = await import('./ecommerce/cartStore');
          await useCartStore.getState().syncLocalToServer();
        } catch (e) {
          console.error('Error syncing local cart after login', e);
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
        // Clear only in-memory state (no sensitive info in localStorage)
        set({ user: null, token: null, isAuthenticated: false });

        // Clear cart store and persisted cart data so next user doesn't see previous user's cart
        try {
          const { useCartStore } = await import('./ecommerce/cartStore');
          useCartStore.getState().clearCart();
          try {
            localStorage.removeItem('luxury-cart-storage');
          } catch (e) {
            // ignore localStorage errors
          }
        } catch (e) {
          console.warn('Could not clear cart store on logout', e);
        }
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
    }
  )
);

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
        const user: User = response.data;
        
        // Generate a token for session management
        const token = btoa(JSON.stringify({ userId: user.userId, email: user.email, roleName: user.roleName }));
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },

      register: async (data: RegisterDto) => {
        const response = await apiClient.post('/users/register', data);
        const user: User = response.data;
        
        // Generate a token for session management
        const token = btoa(JSON.stringify({ userId: user.userId, email: user.email, roleName: user.roleName }));
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        // Clear all authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        
        // Clear cart data
        localStorage.removeItem('luxury-cart-storage');
        
        // Clear any other app-specific data
        localStorage.removeItem('cart-storage');
        
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
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

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
        const user = response.data;
        
        // Generate a mock token (in production, backend should provide this)
        const token = btoa(JSON.stringify({ userId: user.userId, role: user.role }));
        
        localStorage.setItem('authToken', token);
        set({ user, token, isAuthenticated: true });
      },

      register: async (data: RegisterDto) => {
        const response = await apiClient.post('/users/register', data);
        const user = response.data;
        
        const token = btoa(JSON.stringify({ userId: user.userId, role: user.role }));
        
        localStorage.setItem('authToken', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, isAuthenticated: false });
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

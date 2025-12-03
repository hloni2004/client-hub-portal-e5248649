import { create } from 'zustand';
import { User } from '@/types';
import apiClient from '@/lib/api';

interface UserState {
  users: User[];
  clients: User[];
  staff: User[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: number, data: Partial<User>) => Promise<void>;
  deactivateUser: (id: number) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  clients: [],
  staff: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/users');
      set({ users: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchClients: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/users/role/CLIENT');
      set({ clients: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchStaff: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/users/role/STAFF');
      set({ staff: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createUser: async (data) => {
    const response = await apiClient.post('/users/register', data);
    set((state) => ({ users: [...state.users, response.data] }));
  },

  updateUser: async (id: number, data: Partial<User>) => {
    const response = await apiClient.put(`/users/${id}`, data);
    set((state) => ({
      users: state.users.map((u) => (u.userId === id ? response.data : u)),
      clients: state.clients.map((u) => (u.userId === id ? response.data : u)),
      staff: state.staff.map((u) => (u.userId === id ? response.data : u)),
    }));
  },

  deactivateUser: async (id: number) => {
    await apiClient.delete(`/users/${id}`);
    set((state) => ({
      users: state.users.filter((u) => u.userId !== id),
      clients: state.clients.filter((u) => u.userId !== id),
      staff: state.staff.filter((u) => u.userId !== id),
    }));
  },

  resetPassword: async (email: string) => {
    await apiClient.post('/users/reset-password', { email });
  },
}));

import { create } from 'zustand';
import { Notification } from '@/types';
import apiClient from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (userId: number) => Promise<void>;
  fetchUnreadCount: (userId: number) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: (userId: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/notifications/user/${userId}/ordered`);
      set({ notifications: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchUnreadCount: async (userId: number) => {
    try {
      const response = await apiClient.get(`/notifications/user/${userId}/unread-count`);
      set({ unreadCount: response.data });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (notificationId: number) => {
    await apiClient.put(`/notifications/${notificationId}/mark-read`);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async (userId: number) => {
    await apiClient.put(`/notifications/user/${userId}/mark-all-read`);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));

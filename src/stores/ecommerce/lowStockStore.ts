import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface LowStockAlert {
  id: number;
  name: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  size?: string;
  color?: string;
}

interface LowStockState {
  alerts: LowStockAlert[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  
  fetchLowStockAlerts: () => Promise<void>;
  dismissAlert: (alertId: number) => void;
  clearAllAlerts: () => void;
  markAsRead: () => void;
}

export const useLowStockStore = create<LowStockState>((set) => ({
  alerts: [],
  loading: false,
  error: null,
  unreadCount: 0,

  fetchLowStockAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/products/low-stock');
      const lowStockAlerts: LowStockAlert[] = response.data.data || response.data || [];
      set({ 
        alerts: lowStockAlerts,
        unreadCount: lowStockAlerts.length,
        loading: false 
      });
    } catch (error) {
      console.error('Failed to fetch low stock alerts:', error);
      set({ error: 'Failed to fetch low stock alerts', loading: false });
    }
  },

  dismissAlert: (alertId: number) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== alertId),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  clearAllAlerts: () => {
    set({ alerts: [], unreadCount: 0 });
  },

  markAsRead: () => {
    set({ unreadCount: 0 });
  },
}));

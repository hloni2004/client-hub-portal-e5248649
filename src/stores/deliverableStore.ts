import { create } from 'zustand';
import { Deliverable } from '@/types';
import apiClient from '@/lib/api';

interface DeliverableState {
  deliverables: Deliverable[];
  loading: boolean;
  fetchDeliverables: () => Promise<void>;
  fetchDeliverablesByProject: (projectId: number) => Promise<void>;
  uploadDeliverable: (data: { fileName: string; fileType: string; fileUrl: string; projectId: number; taskId?: number }) => Promise<void>;
  approveDeliverable: (id: number) => Promise<void>;
  deleteDeliverable: (id: number) => Promise<void>;
}

export const useDeliverableStore = create<DeliverableState>((set) => ({
  deliverables: [],
  loading: false,

  fetchDeliverables: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/deliverables');
      set({ deliverables: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchDeliverablesByProject: async (projectId: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/deliverables/project/${projectId}`);
      set({ deliverables: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  uploadDeliverable: async (data) => {
    const response = await apiClient.post('/deliverables/upload', data);
    set((state) => ({ deliverables: [...state.deliverables, response.data] }));
  },

  approveDeliverable: async (id: number) => {
    await apiClient.put(`/deliverables/${id}/approve`);
    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.deliverableId === id ? { ...d, approved: true } : d
      ),
    }));
  },

  deleteDeliverable: async (id: number) => {
    await apiClient.delete(`/deliverables/${id}`);
    set((state) => ({
      deliverables: state.deliverables.filter((d) => d.deliverableId !== id),
    }));
  },
}));

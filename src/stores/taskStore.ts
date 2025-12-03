import { create } from 'zustand';
import { Task, TaskStatus } from '@/types';
import apiClient from '@/lib/api';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  fetchTasks: () => Promise<void>;
  fetchTasksByProject: (projectId: number) => Promise<void>;
  fetchTasksByUser: (userId: number) => Promise<void>;
  createTask: (data: Omit<Task, 'taskId' | 'status'>) => Promise<void>;
  updateTask: (id: number, data: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: number, status: TaskStatus) => Promise<void>;
  assignTask: (id: number, userId: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  currentTask: null,
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/tasks');
      set({ tasks: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchTasksByProject: async (projectId: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/tasks/project/${projectId}`);
      set({ tasks: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchTasksByUser: async (userId: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/tasks/user/${userId}`);
      set({ tasks: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createTask: async (data) => {
    const response = await apiClient.post('/tasks/create', data);
    set((state) => ({ tasks: [...state.tasks, response.data] }));
  },

  updateTask: async (id: number, data: Partial<Task>) => {
    const response = await apiClient.put(`/tasks/${id}/update`, data);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.taskId === id ? response.data : t
      ),
    }));
  },

  updateTaskStatus: async (id: number, status: TaskStatus) => {
    await apiClient.put(`/tasks/${id}/status`, { status });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.taskId === id ? { ...t, status } : t
      ),
    }));
  },

  assignTask: async (id: number, userId: number) => {
    await apiClient.put(`/tasks/${id}/assign`, { userId });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.taskId === id ? { ...t, assignedToId: userId } : t
      ),
    }));
  },

  deleteTask: async (id: number) => {
    await apiClient.delete(`/tasks/${id}`);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.taskId !== id),
    }));
  },
}));

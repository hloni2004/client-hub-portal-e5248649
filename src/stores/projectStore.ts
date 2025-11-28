import { create } from 'zustand';
import { Project, ProjectStatus } from '@/types';
import apiClient from '@/lib/api';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProjectsByClient: (clientId: number) => Promise<void>;
  fetchProjectById: (id: number) => Promise<void>;
  createProject: (data: Omit<Project, 'projectId' | 'status' | 'progress'>) => Promise<void>;
  updateProjectStatus: (id: number, status: ProjectStatus) => Promise<void>;
  updateProjectProgress: (id: number, progress: number) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/projects');
      set({ projects: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchProjectsByClient: async (clientId: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/projects/client/${clientId}`);
      set({ projects: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchProjectById: async (id: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/projects/${id}`);
      set({ currentProject: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createProject: async (data) => {
    const response = await apiClient.post('/projects/create', data);
    set((state) => ({ projects: [...state.projects, response.data] }));
  },

  updateProjectStatus: async (id: number, status: ProjectStatus) => {
    await apiClient.put(`/projects/${id}/status`, { status });
    set((state) => ({
      projects: state.projects.map((p) =>
        p.projectId === id ? { ...p, status } : p
      ),
    }));
  },

  updateProjectProgress: async (id: number, progress: number) => {
    await apiClient.put(`/projects/${id}/progress`, { progress });
    set((state) => ({
      projects: state.projects.map((p) =>
        p.projectId === id ? { ...p, progress } : p
      ),
    }));
  },
}));

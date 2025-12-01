import { create } from 'zustand';
import apiClient from '@/lib/api';

interface GoogleSheetProject {
  projectId: number;
  clientId: number;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  status: string;
  progress: number;
}

interface GoogleSheetTask {
  taskId: number;
  title: string;
  description: string;
  projectId: number;
  assignedToId: number | null;
  dueDate: string;
  status: string;
}

interface GoogleSheetUser {
  userId: number;
  name: string;
  email: string;
  role: string;
  companyName: string;
  createdAt: string;
}

interface GoogleSheetsState {
  // Projects
  sheetProjects: any[][];
  fetchGoogleSheetProjects: () => Promise<void>;
  addProjectToSheet: (project: GoogleSheetProject) => Promise<void>;
  syncProjectsToSheet: (projects: GoogleSheetProject[]) => Promise<void>;

  // Tasks
  sheetTasks: any[][];
  fetchGoogleSheetTasks: () => Promise<void>;
  addTaskToSheet: (task: GoogleSheetTask) => Promise<void>;
  syncTasksToSheet: (tasks: GoogleSheetTask[]) => Promise<void>;

  // Users
  sheetUsers: any[][];
  fetchGoogleSheetUsers: () => Promise<void>;
  addUserToSheet: (user: GoogleSheetUser) => Promise<void>;
  syncUsersToSheet: (users: GoogleSheetUser[]) => Promise<void>;

  loading: boolean;
  error: string | null;
}

export const useGoogleSheetsStore = create<GoogleSheetsState>((set) => ({
  sheetProjects: [],
  sheetTasks: [],
  sheetUsers: [],
  loading: false,
  error: null,

  // ==================== PROJECTS ====================
  
  fetchGoogleSheetProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/sheets/projects');
      set({ sheetProjects: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch projects from Google Sheets',
        loading: false 
      });
      throw error;
    }
  },

  addProjectToSheet: async (project: GoogleSheetProject) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/sheets/projects', project);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to add project to Google Sheets',
        loading: false 
      });
      throw error;
    }
  },

  syncProjectsToSheet: async (projects: GoogleSheetProject[]) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/sheets/projects/sync', projects);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to sync projects to Google Sheets',
        loading: false 
      });
      throw error;
    }
  },

  // ==================== TASKS ====================

  fetchGoogleSheetTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/sheets/tasks');
      set({ sheetTasks: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch tasks from Google Sheets',
        loading: false 
      });
      throw error;
    }
  },

  addTaskToSheet: async (task: GoogleSheetTask) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/sheets/tasks', task);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to add task to Google Sheets',
        loading: false 
      });
      throw error;
    }
  },

  syncTasksToSheet: async (tasks: GoogleSheetTask[]) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/sheets/tasks/sync', tasks);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to sync tasks to Google Sheets',
        loading: false 
      });
      throw error;
    }
  },

  // ==================== USERS ====================

  fetchGoogleSheetUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/sheets/users');
      set({ sheetUsers: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch users from Google Sheets',
        loading: false 
      });
      throw error;
    }
  },

  addUserToSheet: async (user: GoogleSheetUser) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/sheets/users', user);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to add user to Google Sheets',
        loading: false 
      });
      throw error;
    }
  },

  syncUsersToSheet: async (users: GoogleSheetUser[]) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/sheets/users/sync', users);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to sync users to Google Sheets',
        loading: false 
      });
      throw error;
    }
  },
}));

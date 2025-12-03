export enum UserRole {
  CLIENT = 'CLIENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export interface User {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
}

export enum ProjectStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Project {
  projectId: number;
  clientId: number;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
  progress: number;
  client?: User;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export interface Task {
  taskId: number;
  title: string;
  description: string;
  projectId: number;
  assignedToId: number;
  dueDate: string;
  status: TaskStatus;
  deliverable?: string;
  notes?: string;
  project?: Project;
  assignedTo?: User;
}

export enum ProjectAccessRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
}

export interface ProjectUser {
  id: number;
  projectId: number;
  userId: number;
  role: ProjectAccessRole;
  user?: User;
  project?: Project;
}

export enum NotificationType {
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED',
  DELIVERABLE_APPROVED = 'DELIVERABLE_APPROVED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface Notification {
  notificationId: number;
  message: string;
  type: NotificationType;
  userId: number;
  isRead: boolean;
  createdAt: string;
}

export interface Deliverable {
  deliverableId: number;
  fileName: string;
  fileType: string;
  filePath: string;
  projectId: number;
  taskId?: number;
  approved: boolean;
  uploadedAt: string;
  project?: Project;
}

export interface Feedback {
  feedbackId: number;
  message: string;
  deliverableId: number;
  userId: number;
  createdAt: string;
  user?: User;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

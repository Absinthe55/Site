export enum Role {
  MANAGER = 'MANAGER',
  MASTER = 'MASTER'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
}

export interface Machine {
  id: string;
  name: string;
  location: string;
  type: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  machineId?: string; // Optional now, as we might use manual name
  machineName?: string; // Manual entry support
  imageUrl?: string; // Image support
  assigneeId: string; // The Master assigned
  creatorId: string; // The Manager
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number; // When status changed to IN_PROGRESS
  completedAt?: number; // When status changed to COMPLETED
  aiSuggestions?: string;
  managerNote?: string; // Amirin değerlendirme notu
  rating?: number; // 1-5 arası puan
}
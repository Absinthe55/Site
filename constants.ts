import { Machine, Role, Task, TaskPriority, TaskStatus, User } from "./types";

export const APP_VERSION = 'v1.0.9';

export const USERS: User[] = [
  {
    id: 'u1',
    name: 'ERKAN ÇİLİNGİR',
    role: Role.MANAGER,
    avatar: 'https://picsum.photos/id/1/200/200'
  },
  {
    id: 'u2',
    name: 'Mehmet Usta',
    role: Role.MASTER,
    avatar: 'https://picsum.photos/id/1005/200/200'
  },
  {
    id: 'u3',
    name: 'Ali Usta',
    role: Role.MASTER,
    avatar: 'https://picsum.photos/id/1012/200/200'
  }
];

export const MACHINES: Machine[] = [
  { id: 'm1', name: 'Pres Hattı 1 - Ana Pompa', location: 'Bölge A', type: 'Hidrolik Pres' },
  { id: 'm2', name: 'Enjeksiyon 4', location: 'Bölge B', type: 'Enjeksiyon Makinesi' },
  { id: 'm3', name: 'Konveyör Asansör', location: 'Lojistik', type: 'Hidrolik Lift' },
  { id: 'm4', name: 'Kesim Giyotini', location: 'Bölge C', type: 'Kesici' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Yağ Kaçağı Kontrolü',
    description: 'Ana tank seviyesinde düşüş var. Rakor bağlantılarını kontrol et.',
    machineId: 'm1',
    assigneeId: 'u2',
    creatorId: 'u1',
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    createdAt: Date.now() - 86400000,
    startedAt: Date.now() - 3600000, // Started 1 hour ago
  },
  {
    id: 't2',
    title: 'Filtre Değişimi',
    description: 'Dönüş hattı filtresi tıkanıklık uyarısı veriyor.',
    machineId: 'm2',
    assigneeId: 'u3',
    creatorId: 'u1',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
    createdAt: Date.now() - 12000000,
  }
];
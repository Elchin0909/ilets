import api from './axios';

export interface PendingStudent {
  userId: string;
  username: string;
  studentId: string;
  fullName: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export const getPendingStudents = () =>
  api.get<PendingStudent[]>('/admin/pending-students').then((r) => r.data);

export const approveStudent = (studentId: string) =>
  api.post(`/admin/pending-students/${studentId}/approve`).then((r) => r.data);

/* ── Notifications ── */
export interface AppNotification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export const getNotifications = () =>
  api.get<AppNotification[]>('/notifications').then((r) => r.data);

export const getUnreadCount = () =>
  api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count);

export const markNotificationRead = (id: string) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data);

export const markAllNotificationsRead = () =>
  api.patch('/notifications/read-all');

export const createNotification = (data: Partial<AppNotification>) =>
  api.post<AppNotification>('/notifications', data).then((r) => r.data);

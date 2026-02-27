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

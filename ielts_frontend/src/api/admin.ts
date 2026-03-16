import api from './axios';
import type { UserInfo } from '../types';

export const getUsers = () =>
  api.get<UserInfo[]>('/admin/users').then((r) => r.data);

export const resetUserPassword = (userId: string, newPassword: string) =>
  api.post(`/admin/users/${userId}/reset-password`, { newPassword }).then((r) => r.data);

export const createUser = (data: { username: string; password: string; role: string; teacherId?: string }) =>
  api.post('/admin/users', data).then((r) => r.data);

export const createStudentAccount = (studentId: string, username: string, password: string) =>
  api.post(`/admin/students/${studentId}/create-account`, { username, password }).then((r) => r.data);

export const resetStudentPassword = (studentId: string, newPassword: string) =>
  api.post(`/admin/students/${studentId}/reset-password`, { newPassword }).then((r) => r.data);

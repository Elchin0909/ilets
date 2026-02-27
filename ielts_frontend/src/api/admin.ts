import api from './axios';
import type { UserInfo } from '../types';

export const getUsers = () =>
  api.get<UserInfo[]>('/admin/users').then((r) => r.data);

export const resetUserPassword = (userId: string, newPassword: string) =>
  api.post(`/admin/users/${userId}/reset-password`, { newPassword }).then((r) => r.data);

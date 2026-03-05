import api from './axios';
import type { LoginRequest, LoginResponse, MeResponse } from '../types';

export const login = (data: LoginRequest) =>
  api.post<LoginResponse>('/auth/login-v2', data).then((r) => r.data);

export const logout = (refreshToken: string) =>
  api.post('/auth/logout', { refreshToken });

export const getMe = () =>
  api.get<MeResponse>('/auth/me').then((r) => r.data);

export const refreshToken = (refreshToken: string) =>
  api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data);

// Admin: reset a teacher's password by their teacherId (UUID)
export const resetTeacherPassword = (teacherId: string, newPassword: string) =>
  api.post('/auth/teacher/reset-password', { teacherId, newPassword }).then((r) => r.data);

// Any user: change own password
export const changeMyPassword = (newPassword: string) =>
  api.post('/auth/change-password', { newPassword }).then((r) => r.data);

// Public: student self-registration
export const registerStudent = (data: {
  fullName: string;
  phone: string;
  email?: string;
  username: string;
  password: string;
}) => api.post('/auth/register', data).then((r) => r.data);



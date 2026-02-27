import api from './axios';
import type { Teacher, TeacherCreateRequest } from '../types';

// Backend sends { teacherId: UUID, fullName, phone, email, username }
const mapTeacher = (t: any): Teacher => ({
  id: String(t.teacherId ?? t.id),
  teacherId: String(t.teacherId ?? t.id),
  fullName: t.fullName,
  phone: t.phone,
  email: t.email,
  username: t.username,
});

export const getTeachers = () =>
  api.get<any[]>('/teachers').then((r) => r.data.map(mapTeacher));

export const getTeacher = (id: string) =>
  api.get<any>(`/teachers/${id}`).then((r) => mapTeacher(r.data));

export const createTeacher = (data: TeacherCreateRequest) =>
  api.post<any>('/teachers', data).then((r) => mapTeacher(r.data));

export const updateTeacher = (id: string, data: Partial<TeacherCreateRequest>) =>
  api.put<any>(`/teachers/${id}`, data).then((r) => mapTeacher(r.data));

export const deleteTeacher = (id: string) =>
  api.delete(`/teachers/${id}`);

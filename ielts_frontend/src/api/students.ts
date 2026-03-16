import api from './axios';
import type { Student, StudentCreateRequest } from '../types';

// Backend sends { studentId: UUID, fullName, phone, email, ... }
const mapStudent = (s: any): Student => ({
  id: String(s.studentId ?? s.id),
  fullName: s.fullName,
  phone: s.phone,
  email: s.email,
  birthDate: s.birthDate,
  avatarUrl: s.avatarUrl,
  ieltsBandScore: s.ieltsBandScore,
  targetBandScore: s.targetBandScore,
  createdAt: s.createdAt,
  hasAccount: s.hasAccount ?? false,
  username: s.username,
});

export const getStudents = () =>
  api.get<any[]>('/students').then((r) => r.data.map(mapStudent));

export const getStudent = (id: string) =>
  api.get<any>(`/students/${id}`).then((r) => mapStudent(r.data));

export const createStudent = (data: StudentCreateRequest) =>
  api.post<any>('/students', data).then((r) => mapStudent(r.data));

export const updateStudent = (id: string, data: Partial<StudentCreateRequest>) =>
  api.put<any>(`/students/${id}`, data).then((r) => mapStudent(r.data));

export const deleteStudent = (id: string) =>
  api.delete(`/students/${id}`);

export const updateStudentAvatar = (id: string, avatarUrl: string) =>
  api.patch<any>(`/students/${id}/avatar`, { avatarUrl }).then((r) => r.data);

export const updateBandScore = (id: string, ieltsBandScore?: number, targetBandScore?: number) =>
  api.patch(`/students/${id}/band-score`, { ieltsBandScore, targetBandScore }).then((r) => r.data);

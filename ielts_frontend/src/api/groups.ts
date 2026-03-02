import api from './axios';
import type { Group, GroupCreateRequest, Enrollment, EnrollmentCreateRequest } from '../types';

// Backend sends { groupId: UUID, courseId: UUID, teacherId: UUID, groupName, startDate, endDate, schedule }
const mapGroup = (g: any): Group => ({
  id: String(g.groupId ?? g.id),
  name: g.groupName ?? g.name ?? '',
  courseId: String(g.courseId),
  teacherId: String(g.teacherId),
  startDate: g.startDate,
  endDate: g.endDate,
  schedule: g.schedule,
});

// Backend expects { groupName, courseId (UUID), teacherId (UUID), startDate, endDate }
const toBackend = (data: GroupCreateRequest) => ({
  groupName: data.name,
  courseId: data.courseId,
  teacherId: data.teacherId,
  startDate: data.startDate || undefined,
  endDate: data.endDate || undefined,
});

// Backend enrollment: { enrollmentId: UUID, studentId: UUID, groupId: UUID, status, enrolledAt }
const mapEnrollment = (e: any): Enrollment => ({
  id: String(e.enrollmentId ?? e.id),
  studentId: String(e.studentId),
  studentName: e.studentName,
  groupId: String(e.groupId),
  groupName: e.groupName,
  status: e.status,
  enrolledAt: e.enrolledAt,
});

export const getGroups = () =>
  api.get<any[]>('/groups').then((r) => r.data.map(mapGroup));

export const getGroup = (id: string) =>
  api.get<any>(`/groups/${id}`).then((r) => mapGroup(r.data));

export const createGroup = (data: GroupCreateRequest) =>
  api.post<any>('/groups', toBackend(data)).then((r) => mapGroup(r.data));

export const updateGroup = (id: string, data: GroupCreateRequest) =>
  api.put<any>(`/groups/${id}`, toBackend(data)).then((r) => mapGroup(r.data));

export const deleteGroup = (id: string) =>
  api.delete(`/groups/${id}`);

export const getGroupEnrollments = (groupId: string) =>
  api.get<any[]>(`/groups/${groupId}/enrollments`).then((r) => r.data.map(mapEnrollment));

// Enrollment management
export const getEnrollments = () =>
  api.get<any[]>('/enrollments').then((r) => r.data.map(mapEnrollment));

export const createEnrollment = (data: EnrollmentCreateRequest) =>
  api.post<any>('/enrollments', data).then((r) => mapEnrollment(r.data));

export const deleteEnrollment = (id: string) =>
  api.delete(`/enrollments/${id}`);

export const updateEnrollmentStatus = (id: string, status: string) =>
  api.patch(`/enrollments/${id}/status`, null, { params: { status } });

export const getEnrollmentsByStudent = (studentId: string) =>
  api.get<any[]>(`/enrollments/by-student/${studentId}`).then((r) => r.data.map(mapEnrollment));

export const getGroupAttendanceSummary = (groupId: string) =>
  api.get<any>(`/v1/teacher/dashboard/groups/${groupId}/attendance`).then((r) => r.data);

export const getGroupAvgExamScore = (groupId: string) =>
  api.get<any>(`/v1/teacher/dashboard/groups/${groupId}/avg-exam-score`).then((r) => r.data);

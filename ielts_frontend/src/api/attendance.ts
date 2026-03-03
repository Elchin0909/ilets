import api from './axios';
import type { AttendanceRecord, AttendanceMarkRequest } from '../types';

export const getAttendanceByLesson = (lessonId: string | number) =>
  api.get<AttendanceRecord[]>(`/attendance/by-lesson/${lessonId}`).then((r) => r.data);

export const getAttendanceByStudent = (studentId: string | number) =>
  api.get<AttendanceRecord[]>(`/attendance/by-student/${studentId}`).then((r) => r.data);

export const markAttendance = (data: AttendanceMarkRequest) =>
  api.post('/attendance', data).then((r) => r.data);

export const bulkMarkAttendance = (lessonId: string | number, records: AttendanceMarkRequest[]) =>
  api.post(`/attendance/by-lesson/${lessonId}/bulk`, { records }).then((r) => r.data);

export const getStudentAttendancePercent = (studentId: string | number) =>
  api.get<number>(`/attendance/student/${studentId}/percent`).then((r) => r.data);

export const getGroupAttendancePercent = (groupId: string | number) =>
  api.get(`/attendance/group/${groupId}/percent`).then((r) => r.data);

export interface LowAttendanceStudent {
  studentId: string;
  fullName: string;
  totalLessons: number;
  presentCount: number;
  attendancePercent: number;
}

export const getLowAttendanceStudents = (threshold = 75) =>
  api.get<LowAttendanceStudent[]>('/attendance/low-attendance', { params: { threshold } }).then((r) => r.data);

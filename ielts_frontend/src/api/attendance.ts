import api from './axios';
import type { AttendanceRecord, AttendanceMarkRequest } from '../types';

export const getAttendanceByLesson = (lessonId: number) =>
  api.get<AttendanceRecord[]>(`/attendance/by-lesson/${lessonId}`).then((r) => r.data);

export const getAttendanceByStudent = (studentId: number) =>
  api.get<AttendanceRecord[]>(`/attendance/by-student/${studentId}`).then((r) => r.data);

export const markAttendance = (data: AttendanceMarkRequest) =>
  api.post('/attendance', data).then((r) => r.data);

export const bulkMarkAttendance = (lessonId: number, records: AttendanceMarkRequest[]) =>
  api.post(`/attendance/by-lesson/${lessonId}/bulk`, { records }).then((r) => r.data);

export const getStudentAttendancePercent = (studentId: number) =>
  api.get<number>(`/attendance/student/${studentId}/percent`).then((r) => r.data);

export const getGroupAttendancePercent = (groupId: number) =>
  api.get(`/attendance/group/${groupId}/percent`).then((r) => r.data);

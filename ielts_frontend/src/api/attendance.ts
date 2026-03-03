import api from './axios';

export interface AttendanceRow {
  lessonId: string;
  studentId: string;
  fullName?: string;
  status: 'present' | 'absent' | 'late' | null;
  comment?: string;
  lessonDate?: string;
}

export interface BulkAttendanceItem {
  studentId: string;
  status: string;
  comment?: string;
}

// Darsga qarab davomat ro'yxati
export const getAttendanceByLesson = (lessonId: string) =>
  api.get<AttendanceRow[]>(`/attendance/by-lesson/${lessonId}`).then((r) => r.data);

// Talabaga qarab davomat tarixi
export const getAttendanceByStudent = (studentId: string) =>
  api.get<AttendanceRow[]>(`/attendance/by-student/${studentId}`).then((r) => r.data);

// Bir talaba uchun belgilash (single mark)
export const markAttendance = (data: { lessonId: string; studentId: string; status: string; comment?: string }) =>
  api.post('/attendance', data).then((r) => r.data);

// Ko'p talaba uchun bulk mark — backend { items: [...] } kutadi
export const bulkMarkAttendance = (lessonId: string, items: BulkAttendanceItem[]) =>
  api.post(`/attendance/by-lesson/${lessonId}/bulk`, { items }).then((r) => r.data);

export const getStudentAttendancePercent = (studentId: string) =>
  api.get<number>(`/attendance/student/${studentId}/percent`).then((r) => r.data);

export const getGroupAttendancePercent = (groupId: string) =>
  api.get<number>(`/attendance/group/${groupId}/percent`).then((r) => r.data);

export interface LowAttendanceStudent {
  studentId: string;
  fullName: string;
  totalLessons: number;
  presentCount: number;
  attendancePercent: number;
}

export const getLowAttendanceStudents = (threshold = 75) =>
  api.get<LowAttendanceStudent[]>('/attendance/low-attendance', { params: { threshold } }).then((r) => r.data);

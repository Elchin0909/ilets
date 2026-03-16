import api from './axios';

export interface Homework {
  homeworkId: string;
  groupId: string;
  teacherId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  createdAt: string;
  submissionCount?: number;
  gradedCount?: number;
}

export interface HomeworkSubmission {
  submissionId: string;
  homeworkId: string;
  studentId: string;
  studentName?: string;
  content?: string;
  fileUrl?: string;
  grade?: number;
  feedback?: string;
  status: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface HomeworkDetail extends Homework {
  submissions: HomeworkSubmission[];
}

// Teacher / Admin
export const getAllHomework = () =>
  api.get<Homework[]>('/homework').then((r) => r.data);

export const getHomeworkByGroup = (groupId: string) =>
  api.get<Homework[]>(`/homework/group/${groupId}`).then((r) => r.data);

export const getHomeworkDetail = (id: string) =>
  api.get<HomeworkDetail>(`/homework/${id}`).then((r) => r.data);

export const createHomework = (data: Partial<Homework>) =>
  api.post<Homework>('/homework', data).then((r) => r.data);

export const updateHomework = (id: string, data: Partial<Homework>) =>
  api.put<Homework>(`/homework/${id}`, data).then((r) => r.data);

export const deleteHomework = (id: string) =>
  api.delete(`/homework/${id}`);

export const gradeSubmission = (subId: string, grade: number, feedback: string) =>
  api.post(`/homework/submissions/${subId}/grade`, { grade, feedback }).then((r) => r.data);

// Student
export const getMyHomework = () =>
  api.get<(Homework & { mySubmission?: { submissionId: string; status: string; grade: string; feedback: string } })[]>('/homework/my').then((r) => r.data);

export const submitHomework = (hwId: string, data: { content?: string; fileUrl?: string }) =>
  api.post(`/homework/${hwId}/submit`, data).then((r) => r.data);

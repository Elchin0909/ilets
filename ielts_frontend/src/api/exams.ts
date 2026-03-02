import api from './axios';
import type { Exam, ExamCreateRequest, ExamResult, ExamResultUpsertRequest } from '../types';

export const getExamsByGroup = (groupId: string | number) =>
  api.get<Exam[]>(`/exams/by-group/${groupId}`).then((r) => r.data);

export const getExam = (examId: string | number) =>
  api.get<Exam>(`/exams/${examId}`).then((r) => r.data);

export const createExam = (data: ExamCreateRequest) =>
  api.post<Exam>('/exams', data).then((r) => r.data);

export const updateExam = (id: string | number, data: Partial<ExamCreateRequest>) =>
  api.put<Exam>(`/exams/${id}`, data).then((r) => r.data);

export const deleteExam = (id: string | number) =>
  api.delete(`/exams/${id}`);

export const getExamResults = (examId: string | number) =>
  api.get<ExamResult[]>(`/exams/${examId}/results`).then((r) => r.data);

export const upsertExamResult = (examId: string | number, data: ExamResultUpsertRequest) =>
  api.post<ExamResult>(`/exams/${examId}/results`, data).then((r) => r.data);

export const bulkUpsertExamResults = (examId: string | number, results: ExamResultUpsertRequest[]) =>
  api.post(`/exams/${examId}/results/bulk`, { results }).then((r) => r.data);

export const getStudentExamResults = (studentId: string | number) =>
  api.get<ExamResult[]>(`/exams/results/by-student/${studentId}`).then((r) => r.data);

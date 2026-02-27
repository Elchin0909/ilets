import api from './axios';
import type { Exam, ExamCreateRequest, ExamResult, ExamResultUpsertRequest } from '../types';

export const getExamsByGroup = (groupId: number) =>
  api.get<Exam[]>(`/exams/by-group/${groupId}`).then((r) => r.data);

export const getExam = (examId: number) =>
  api.get<Exam>(`/exams/${examId}`).then((r) => r.data);

export const createExam = (data: ExamCreateRequest) =>
  api.post<Exam>('/exams', data).then((r) => r.data);

export const getExamResults = (examId: number) =>
  api.get<ExamResult[]>(`/exams/${examId}/results`).then((r) => r.data);

export const upsertExamResult = (examId: number, data: ExamResultUpsertRequest) =>
  api.post<ExamResult>(`/exams/${examId}/results`, data).then((r) => r.data);

export const bulkUpsertExamResults = (examId: number, results: ExamResultUpsertRequest[]) =>
  api.post(`/exams/${examId}/results/bulk`, { results }).then((r) => r.data);

export const getStudentExamResults = (studentId: number) =>
  api.get<ExamResult[]>(`/exams/results/by-student/${studentId}`).then((r) => r.data);

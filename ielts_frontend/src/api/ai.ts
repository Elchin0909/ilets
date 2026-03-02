import api from './axios';

export interface WritingAssessResponse {
  level: string;
  bandRange: string;
  taskAchievement: string;
  coherence: string;
  grammar: string;
  vocabulary: string;
  recommendations: string;
}

export interface BandPredictionResponse {
  predictedBand: string;
  confidence: string;
  weakestSkill: string;
  analysis: string;
  recommendations: string;
}

export interface WritingLogEntry {
  logId: string;
  studentId: string | null;
  studentName: string | null;
  taskType: string;
  level: string;
  bandRange: string;
  textSnippet: string;
  createdAt: string;
}

export interface WritingStats {
  total: number;
  byLevel: Record<string, number>;
  byTaskType: Record<string, number>;
  recent: WritingLogEntry[];
}

export const assessWriting = (text: string, taskType: 'task1' | 'task2', studentId?: string) =>
  api.post<WritingAssessResponse>('/ai/assess-writing', { text, taskType, studentId: studentId || null }).then((r) => r.data);

export const predictBand = (studentId: string) =>
  api.post<BandPredictionResponse>(`/ai/predict-band/${studentId}`).then((r) => r.data);

export const aiChat = (message: string) =>
  api.post<{ reply: string }>('/ai/chat', { message }).then((r) => r.data.reply);

export const getWritingStats = () =>
  api.get<WritingStats>('/writing-logs/stats').then((r) => r.data);

export const getWritingLogs = () =>
  api.get<WritingLogEntry[]>('/writing-logs').then((r) => r.data);

export const getStudentWritingLogs = (studentId: string) =>
  api.get<WritingLogEntry[]>(`/writing-logs/student/${studentId}`).then((r) => r.data);

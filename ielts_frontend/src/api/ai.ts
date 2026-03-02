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

export const assessWriting = (text: string, taskType: 'task1' | 'task2') =>
  api.post<WritingAssessResponse>('/ai/assess-writing', { text, taskType }).then((r) => r.data);

export const predictBand = (studentId: string) =>
  api.post<BandPredictionResponse>(`/ai/predict-band/${studentId}`).then((r) => r.data);

export const aiChat = (message: string) =>
  api.post<{ reply: string }>('/ai/chat', { message }).then((r) => r.data.reply);

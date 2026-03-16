import api from './axios';

export interface VocabularyItem {
  itemId: string;
  studentId: string;
  word: string;
  translation: string;
  langPair: string;
  pronunciation?: string;
  partOfSpeech?: string;
  examples?: string; // JSON string
  createdAt: string;
}

export interface VocabularyCreateRequest {
  studentId: string;
  word: string;
  translation: string;
  langPair: string;
  pronunciation?: string;
  partOfSpeech?: string;
  examples?: string;
}

export const getStudentVocabulary = (studentId: string) =>
  api.get<VocabularyItem[]>(`/vocabulary/student/${studentId}`).then((r) => r.data);

export const createVocabularyItem = (data: VocabularyCreateRequest) =>
  api.post<VocabularyItem>('/vocabulary', data).then((r) => r.data);

export const deleteVocabularyItem = (itemId: string) =>
  api.delete(`/vocabulary/${itemId}`);
